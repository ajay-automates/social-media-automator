require('dotenv').config();
const { validateEnv } = require('./utilities/env-validator');

// Validate environment variables before starting
validateEnv();

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const fsSync = require('fs');
const crypto = require('crypto');
const axios = require('axios');
// const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const { createClient } = require('@supabase/supabase-js');
const { encryptState, decryptState } = require('./utilities/oauthState');
const {
  schedulePost,
  postNow,
  startScheduler,
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

const { generateCaption, generateHashtags, recommendPostTime, generatePostVariations, generateContentIdeas, improveCaption, generateCaptionFromImage, generateCarouselCaptions } = require('./services/ai');
const { analyzeBestTimes, getPostingHeatmap } = require('./services/analytics');
const { generateWeeklyReport, sendReportToUser, sendWeeklyReportsToAll } = require('./services/reports');
const {
  sendTestEmail,
  sendEmail,
  sendPostSubmissionNotification,
  sendPostApprovalNotification,
  sendPostRejectionNotification,
  sendChangesRequestedNotification
} = require('./services/email');
const { getUserWorkspace, checkPermission, requireRole, requirePermission, getTeamMembers } = require('./services/permissions');
const { logActivity, getActivityFeed, formatActivity, getPendingApprovalsCount } = require('./services/activity');
const { createInvitation, acceptInvitation, getPendingInvitations, cancelInvitation, resendInvitation } = require('./services/invitations');
const { searchVideos, getVideoById, getPopularVideos, validatePexelsKey } = require('./services/video-search');
const { validateCarousel, getCarouselLimits, formatCarouselMetadata } = require('./services/carousel');
const { postLinkedInCarousel } = require('./services/linkedin');
const { getUserBoards, postToPinterest } = require('./services/pinterest');
const { parseCSV, generateTemplate, getValidationSummary } = require('./services/csv-parser');
const aiImageService = require('./services/ai-image');
const {
  extractTranscript,
  generateCaptionFromTranscript
} = require('./services/youtube-transcript');
const {
  scrapeWebContent,
  isYouTubeUrl
} = require('./services/web-scraper-light');
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
  refreshLinkedInToken,
  initiateRedditOAuth,
  handleRedditCallback,
  refreshRedditToken,
  initiateTwitterOAuth,
  handleTwitterCallback,
  initiateInstagramOAuth,
  handleInstagramCallback,
  initiateFacebookOAuth,
  handleFacebookCallback,
  initiatePinterestOAuth,
  handlePinterestCallback,
  initiateMediumOAuth,
  handleMediumCallback,
  initiateTumblrOAuth,
  handleTumblrCallback,
  disconnectAccount,
  disconnectAccountById,
  getUserConnectedAccounts,
  getUserCredentialsForPosting
} = require('./services/oauth');
const { validateBotToken } = require('./services/telegram');
const { validateDevToApiKey, getDevToUserInfo } = require('./services/devto');
const { verifyMastodonCredentials } = require('./services/mastodon');
const { verifyBlueskyCredentials } = require('./services/bluesky');
const { validateWebhook, sendToSlack } = require('./services/slack');
const { validateWebhook: validateDiscordWebhook, sendToDiscord } = require('./services/discord');
const { postToReddit, getModeratedSubreddits } = require('./services/reddit');
const {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  checkUsage,
  incrementUsage,
  getUserBillingInfo
} = require('./services/billing');
const { generateYouTubeOAuthUrl, exchangeYouTubeCode, getChannelInfo } = require('./services/youtube');
const { getAllPlans } = require('./config/plans');
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  incrementTemplateUse,
  toggleTemplateFavorite,
  duplicateTemplate,
  clonePublicTemplate,
  getTemplateCategories,
  getTemplateStats,
  processTemplateVariables
} = require('./services/templates');

// Content Creation Agent
const {
  generateContentCalendar,
  getGeneratedPosts,
  approvePost,
  rejectPost,
  generateTopicIdeas,
  generatePostsFromNews
} = require('./services/content-creation-agent');
const { analyzeBrandVoice, getBrandVoiceProfile } = require('./services/brand-voice-analyzer');
const { getTrendAlerts, monitorTrendsForUser, fetchAllTrends, fetchKeywordTrendingData } = require('./services/trend-monitor');
const { fetchTrendingNews, getNewsByCategory, searchNews, fetchNewsByCategory } = require('./services/news-agent');
const {
  analyzeUserPatterns,
  generateInsights,
  scoreDraftPost,
  getUserInsights,
  getUserPatterns
} = require('./services/analytics-insights-agent');

// Content Recycling Engine
const {
  getRecyclingSettings,
  updateRecyclingSettings,
  getRecyclablePosts,
  recyclePost,
  autoRecyclePosts,
  getRecyclingHistory,
  getRecyclingStats
} = require('./services/content-recycling');

// Webhook Notifications
const {
  WEBHOOK_EVENTS,
  validateWebhookUrl,
  triggerWebhooks,
  getUserWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
  getWebhookStats
} = require('./services/webhooks');

// A/B Testing Engine
const {
  createABTest,
  getUserABTests,
  getTestResults,
  updateVariationMetrics,
  declareWinner,
  cancelTest,
  getABTestingInsights
} = require('./services/ab-testing');

// Hashtag Performance Tracker
const {
  extractHashtags,
  trackHashtagsFromPost,
  updateHashtagEngagement,
  getTopHashtags,
  getWorstHashtags,
  getHashtagSuggestions,
  analyzeHashtagTrends,
  getHashtagAnalytics
} = require('./services/hashtag-tracker');

// Helper function to get frontend URL
function getFrontendUrl() {
  // If explicitly set, use it
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  // In production (Railway), derive from APP_URL or use production domain
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    // Railway auto-provides RAILWAY_PUBLIC_DOMAIN
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    // Fallback to known production URL
    return 'https://capable-motivation-production-7a75.up.railway.app';
  }

  // Local development
  return 'http://localhost:5173';
}

const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// Create admin client for server operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    console.log(`👤 Auth Verified: ${user.email} (${user.id})`);

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
// Trust Railway's reverse proxy for accurate IP detection (rate limiting)
app.set('trust proxy', 1);

const helmet = require('helmet');

app.use(cors());

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.googleusercontent.com", "https://i.pravatar.cc"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://gzchblilbthkfuxqhoyo.supabase.co", "https://api.razorpay.com", "https://lumberjack-cx.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
      upgradeInsecureRequests: [], // Allow mixed content if necessary (though prod should be https)
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some third-party iframes/scripts
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

// Request logging middleware
const requestLogger = require('./middleware/request-logger');
app.use(requestLogger);

// Rate limiting middleware (most specific first)
const {
  aiLimiter,
  authLimiter,
  apiLimiter,
  publicLimiter
} = require('./middleware/rate-limiter');

// Apply rate limiters in order of specificity
app.use('/api/ai', aiLimiter);           // AI endpoints - strictest (50/hour)
app.use('/api/auth', authLimiter);       // Auth API endpoints - strict (10/15min)
app.use('/auth', authLimiter);           // OAuth callbacks - strict (10/15min)
app.use('/api', apiLimiter);             // General API - moderate (100/15min)
app.use(publicLimiter);                  // Public routes - lenient (200/15min)


// IMPORTANT: Serve dashboard static files FIRST in production (with correct MIME types)
if (process.env.NODE_ENV === 'production') {
  const dashboardPath = path.join(__dirname, 'dashboard/dist');
  const fs = require('fs');

  if (fsSync.existsSync(dashboardPath)) {
    // Serve ALL static files from dashboard/dist with correct MIME types
    app.use(express.static(dashboardPath, {
      index: false, // Don't auto-serve index.html
      setHeaders: (res, filePath) => {
        // Ensure correct MIME types
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      }
    }));
    console.log('✅ Production: Static files configured with MIME types from', dashboardPath);
  }
} else {
  // Development: Serve static files for landing page and auth
  app.use(express.static(__dirname, {
    index: false // Don't serve index.html automatically
  }));
}

// Configure Multer for file uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for direct Cloudinary upload
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB for videos, 10MB for images
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
startScheduler();

// ============================================
// PAGE ROUTES (Unprotected)
// ============================================

// Serve landing page from React build
const landingPath = path.join(__dirname, 'landing-dist');
if (fsSync.existsSync(landingPath)) {
  app.use(express.static(landingPath, { index: false }));
  const landingRoutes = ['/', '/privacy', '/terms', '/data-deletion', '/refund-policy', '/contact', '/shipping-policy'];
  landingRoutes.forEach((route) => {
    app.get(route, (req, res) => {
      res.sendFile(path.join(landingPath, 'index.html'));
    });
  });
} else {
  // Fallback to old landing page if React build doesn't exist
  const fallbackRoutes = ['/', '/privacy', '/terms', '/data-deletion'];
  fallbackRoutes.forEach((route) => {
    app.get(route, (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });
  });
}

// Auth page
app.get('/auth', async (req, res) => {
  try {
    const authPath = path.join(__dirname, 'auth.html');
    let content = await fs.readFile(authPath, 'utf8');

    // Inject environment variables
    if (process.env.SUPABASE_URL) {
      content = content.replace(
        /const SUPABASE_URL = '.*';/,
        `const SUPABASE_URL = '${process.env.SUPABASE_URL}';`
      );
    }

    if (process.env.SUPABASE_ANON_KEY) {
      content = content.replace(
        /const SUPABASE_ANON_KEY = '.*';/,
        `const SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY}';`
      );
    }

    res.send(content);
  } catch (err) {
    console.error('Error serving auth page:', err);
    res.status(500).send('Error loading auth page');
  }
});

// Redirect /auth.html to /auth to ensure env vars are injected
app.get('/auth.html', (req, res) => {
  res.redirect('/auth');
});

// Serve React Dashboard static assets first (before catch-all)
try {
  const dashboardPath = path.join(__dirname, 'dashboard/dist');
  const fs = require('fs');

  if (fsSync.existsSync(dashboardPath)) {
    const indexHtmlPath = path.join(dashboardPath, 'index.html');

    if (fsSync.existsSync(indexHtmlPath)) {
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

// Old dashboard removed - using React Dashboard now

// Serve React Dashboard index.html for /dashboard routes
// Serve React Dashboard index.html for /dashboard routes
app.get(['/dashboard', '/dashboard/*'], (req, res) => {
  const dashboardIndex = path.join(__dirname, 'dashboard/dist/index.html');
  const fs = require('fs');

  if (fsSync.existsSync(dashboardIndex)) {
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
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  // Check database
  try {
    const dbHealthy = await healthCheck();
    if (dbHealthy) {
      health.services.database = 'connected';
    } else {
      health.services.database = 'disconnected';
      health.status = 'degraded';
    }
  } catch (err) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }

  // Check Cloudinary
  health.services.cloudinary = process.env.CLOUDINARY_API_KEY ? 'configured' : 'not configured';

  // Check AI services
  health.services.anthropic = process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured';

  // Check Email services
  const hasEmail = (process.env.SMTP_HOST && process.env.SMTP_USER) || process.env.SENDGRID_API_KEY;
  health.services.email = hasEmail ? 'configured' : 'not configured';

  res.status(health.status === 'ok' ? 200 : 503).json(health);
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
 * PUT /api/user/accounts/:id/label
 * Update account label
 */
app.put('/api/user/accounts/:id/label', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;
    const { label } = req.body;

    if (!label || label.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Label is required'
      });
    }

    const { data, error } = await supabase
      .from('user_accounts')
      .update({ account_label: label.trim() })
      .eq('id', accountId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      account: data
    });
  } catch (error) {
    console.error('Error updating account label:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/user/accounts/:id/set-default
 * Set account as default for its platform
 */
app.put('/api/user/accounts/:id/set-default', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;

    // Get the account to find its platform
    const { data: account, error: fetchError } = await supabase
      .from('user_accounts')
      .select('platform')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Unset all defaults for this platform and user
    await supabase
      .from('user_accounts')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('platform', account.platform);

    // Set this account as default
    const { data, error } = await supabase
      .from('user_accounts')
      .update({ is_default: true })
      .eq('id', accountId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      account: data
    });
  } catch (error) {
    console.error('Error setting default account:', error);
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
    const { text, imageUrl, videoUrl, post_metadata, variations, accountIds } = req.body;
    let platforms = req.body.platforms;

    console.log('📹 Post request - Video URL:', videoUrl ? 'Present' : 'None');
    console.log('📋 Selected accounts:', accountIds);

    // Support both single text and platform-specific variations
    if (!text && !variations) {
      return res.status(400).json({
        success: false,
        error: 'Text or variations are required'
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
    let credentials = await getUserCredentialsForPosting(userId);

    // Filter credentials to only include selected accounts per platform
    if (accountIds && typeof accountIds === 'object' && Object.keys(accountIds).length > 0) {
      const filteredCredentials = {};
      for (const platform of platforms) {
        if (accountIds[platform]) {
          // Filter accounts for this platform to only include the selected one
          const selectedAccountId = accountIds[platform];
          if (credentials[platform] && Array.isArray(credentials[platform])) {
            filteredCredentials[platform] = credentials[platform].filter(acc => acc.id === selectedAccountId);
          } else {
            filteredCredentials[platform] = credentials[platform] || [];
          }
        } else {
          // No specific account selected, use all accounts for this platform
          filteredCredentials[platform] = credentials[platform] || [];
        }
      }
      credentials = filteredCredentials;
      console.log('✅ Filtered credentials to selected accounts only');
    }

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
        if (credentials.telegram.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Telegram bot not connected. Please connect your Telegram bot first.'
          });
        }
      }
      if (platform === 'instagram' && credentials.instagram.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Instagram account not connected. Please connect your Instagram account first.'
        });
      }
    }

    // Instagram requires an image
    if (requestedPlatforms.includes('instagram') && !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Instagram requires an image. Please upload or generate an image first.'
      });
    }

    // If base64 image for Instagram, upload to Cloudinary first
    let finalImageUrl = imageUrl;
    if (requestedPlatforms.includes('instagram') && imageUrl && imageUrl.startsWith('data:image')) {
      try {
        const { uploadBase64Image } = require('./services/cloudinary');
        const uploadResult = await uploadBase64Image(
          imageUrl.replace(/^data:image\/\w+;base64,/, ''),
          userId
        );
        if (uploadResult.success) {
          finalImageUrl = uploadResult.url;
          console.log('✅ Uploaded base64 image to Cloudinary for Instagram');
        } else {
          return res.status(400).json({
            success: false,
            error: 'Failed to upload image for Instagram'
          });
        }
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(400).json({
          success: false,
          error: 'Failed to process image for Instagram'
        });
      }
    }

    // Use platform-specific variations if provided, otherwise use single text for all
    const platformResults = await postNow(
      variations || text, // Pass variations object or single text
      finalImageUrl || null,
      platforms,
      credentials,
      post_metadata,
      !!variations, // Flag to indicate if using variations
      videoUrl || null // Pexels video URL
    );

    // Check if all platforms succeeded (handle array results per platform)
    const platformArray = Object.values(platformResults);
    const flattenResults = platformArray.flat().filter(r => r && typeof r === 'object');

    // IMPORTANT: Only treat as success if explicitly success === true
    // This prevents undefined/missing success fields from being treated as success
    const allSuccess = flattenResults.length > 0 && flattenResults.every(r => r.success === true);
    const anySuccess = flattenResults.length > 0 && flattenResults.some(r => r.success === true);
    const allFailed = flattenResults.length > 0 && flattenResults.every(r => r.success === false || r.error);

    // ALWAYS save the post to database, even if all platforms failed
    // This ensures we have a record of all posting attempts
    try {
      // Determine final status
      let status;
      if (flattenResults.length === 0) {
        status = 'failed';
      } else if (allSuccess) {
        status = 'posted';
      } else if (anySuccess) {
        status = 'partial';
      } else {
        status = 'failed';
      }

      // Save post to database
      // If using variations, save the first platform's variation or combine them
      const textToSave = text || (variations ? Object.values(variations)[0] : 'Post with variations');

      const savedPost = await addPost({
        text: textToSave,
        imageUrl: imageUrl || null,
        platforms,
        scheduleTime: new Date(), // For "post now", use current time
        credentials,
        userId
      });

      // Update post status with results
      if (savedPost && savedPost.id) {
        await updatePostStatus(savedPost.id, status, platformResults);
        console.log(`✅ Post saved to database (ID: ${savedPost.id}) with status: ${status}`);
      } else {
        console.error('⚠️  Failed to save post - no ID returned');
      }
    } catch (dbError) {
      console.error('⚠️  Error saving post to database:', dbError);
      console.error('⚠️  Database error details:', JSON.stringify(dbError, null, 2));
      // Don't fail the request if DB save fails, but log it
    }

    // Increment usage count only if any platform succeeded
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

    const result = await schedulePost({
      user_id: userId,
      text: text,
      image_url: imageUrl || null,
      platforms: platforms || ['linkedin'],
      schedule_time: scheduleTime
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to schedule post'
      });
    }

    // Increment usage count
    await incrementUsage(userId, 'posts');

    console.log(`✅ Post scheduled successfully for ${new Date(scheduleTime).toLocaleString()}`);

    res.json({
      success: true,
      message: 'Post scheduled successfully!',
      post: {
        id: result.post.id,
        scheduleTime: result.post.schedule_time
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
 * POST /api/bulk/upload
 * Parse and validate CSV file for bulk scheduling
 */
app.post('/api/bulk/upload', verifyAuth, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Read CSV file content
    const csvContent = await fs.readFile(req.file.path, 'utf-8');

    // Parse and validate CSV
    const parsedData = parseCSV(csvContent);
    const summary = getValidationSummary(parsedData);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    // Track upload in database
    try {
      await supabase.from('bulk_uploads').insert({
        user_id: userId,
        filename: req.file.originalname,
        total_posts: summary.total,
        successful: 0,
        failed: 0,
        status: 'pending'
      });
    } catch (dbError) {
      console.error('Failed to track upload in database:', dbError);
    }

    res.json({
      success: true,
      data: parsedData,
      summary
    });

  } catch (error) {
    console.error('Error in /api/bulk/upload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/bulk/schedule
 * Schedule multiple posts from validated CSV data
 */
app.post('/api/bulk/schedule', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({
        success: false,
        error: 'posts array is required'
      });
    }

    console.log(`\n📂 Bulk scheduling ${posts.length} posts...`);

    const scheduled = [];
    const failed = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const rowNum = post.rowNumber || i + 1;

      try {
        // Validate required fields
        if (!post.caption || !post.platforms || !post.schedule_datetime) {
          failed.push({
            rowNumber: rowNum,
            error: 'Missing required fields'
          });
          continue;
        }

        // Schedule the post
        const scheduleTime = new Date(post.schedule_datetime);
        const postData = {
          text: post.caption,
          platforms: Array.isArray(post.platforms) ? post.platforms : post.platforms.split(','),
          imageUrl: post.image_url || null,
          scheduleTime: scheduleTime.toISOString(),
          redditTitle: post.reddit_title || null,
          redditSubreddit: post.reddit_subreddit || null
        };

        const queueItem = await schedulePost(postData);

        scheduled.push({
          rowNumber: rowNum,
          queueId: queueItem.id,
          scheduleTime: scheduleTime.toISOString()
        });

        console.log(`   ✅ Row ${rowNum}: Scheduled`);

      } catch (error) {
        console.error(`   ❌ Row ${rowNum}:`, error.message);
        failed.push({
          rowNumber: rowNum,
          error: error.message
        });
      }
    }

    console.log(`\n📊 Bulk Schedule Complete:`);
    console.log(`   ✅ Scheduled: ${scheduled.length}`);
    console.log(`   ❌ Failed: ${failed.length}\n`);

    // Update bulk_uploads record
    try {
      const mostRecent = await supabase
        .from('bulk_uploads')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();

      if (mostRecent.data) {
        await supabase
          .from('bulk_uploads')
          .update({
            successful: scheduled.length,
            failed: failed.length,
            status: 'completed'
          })
          .eq('id', mostRecent.data.id);
      }
    } catch (dbError) {
      console.error('Failed to update bulk_uploads:', dbError);
    }

    res.json({
      success: true,
      scheduled: scheduled.length,
      failed: failed.length,
      results: {
        scheduled,
        failed
      }
    });

  } catch (error) {
    console.error('Error in /api/bulk/schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bulk/template
 * Download CSV template for bulk upload (no auth required for template)
 */
app.get('/api/bulk/template', (req, res) => {
  try {
    const template = generateTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk-upload-template.csv"');
    res.status(200).send(template);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /template.csv
 * Download CSV template for bulk upload (legacy endpoint)
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
    const userId = req.user.id;
    const queue = await getQueue(userId);
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
    const userId = req.user.id;
    const postId = parseInt(req.params.id);
    const deleted = await deleteFromQueue(postId, userId);

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
 * GET /api/posts/scheduled
 * Get all scheduled posts for calendar view (protected)
 */
app.get('/api/posts/scheduled', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all posts that are queued (scheduled for future)
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id, text, platforms, schedule_time, image_url, created_at, status')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .gte('schedule_time', new Date().toISOString()) // Future posts only
      .order('schedule_time', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      throw error;
    }

    // Format for calendar
    const scheduledPosts = (data || []).map(post => ({
      id: post.id,
      title: post.text ? post.text.substring(0, 50) + (post.text.length > 50 ? '...' : '') : 'Scheduled Post',
      start: new Date(post.schedule_time),
      end: new Date(post.schedule_time),
      text: post.text,
      platforms: post.platforms,
      image_url: post.image_url,
      status: post.status
    }));

    res.json({
      success: true,
      posts: scheduledPosts,
      count: scheduledPosts.length
    });

  } catch (error) {
    console.error('Error in /api/posts/scheduled:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/posts/:id/reschedule
 * Reschedule a post (drag-and-drop from calendar)
 */
app.put('/api/posts/:id/reschedule', verifyAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const { schedule_time } = req.body;

    if (!schedule_time) {
      return res.status(400).json({
        success: false,
        error: 'schedule_time is required'
      });
    }

    // Verify post belongs to user
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, status')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Only allow rescheduling queued posts
    if (existingPost.status !== 'queued') {
      return res.status(400).json({
        success: false,
        error: 'Can only reschedule queued posts'
      });
    }

    // Update schedule_time
    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update({
        schedule_time: new Date(schedule_time).toISOString()
      })
      .eq('id', postId)
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Post ${postId} rescheduled to ${schedule_time}`);

    res.json({
      success: true,
      message: 'Post rescheduled successfully'
    });

  } catch (error) {
    console.error('❌ Error rescheduling post:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reschedule post'
    });
  }
});

/**
 * GET /api/analytics/best-times
 * Get best times to post recommendations (protected)
 */
app.get('/api/analytics/best-times', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = req.query.platform || 'linkedin';

    // Get user's historical best times
    const historicalData = await analyzeBestTimes(userId);

    // Get AI recommendations based on history
    let aiRecommendations = [];
    try {
      aiRecommendations = await recommendPostTime(platform, historicalData);
    } catch (aiError) {
      console.error('AI recommendations failed, using historical data only:', aiError);
    }

    res.json({
      success: true,
      historical: historicalData,
      recommendations: aiRecommendations,
      platform
    });

  } catch (error) {
    console.error('Error in /api/analytics/best-times:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/heatmap
 * Get posting heatmap data (protected)
 */
app.get('/api/analytics/heatmap', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const heatmap = await getPostingHeatmap(userId);

    res.json({
      success: true,
      heatmap
    });

  } catch (error) {
    console.error('Error in /api/analytics/heatmap:', error);
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
 * GET /api/analytics/export
 * Export analytics data to CSV (protected)
 */
app.get('/api/analytics/export', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { Parser } = require('json2csv');

    // Get post history for the user
    const history = await getPostHistory(100, userId); // Get last 100 posts

    if (!history || history.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No analytics data to export'
      });
    }

    // Prepare data for CSV
    const csvData = history.map(post => ({
      'Date': new Date(post.created_at).toLocaleDateString(),
      'Time': new Date(post.created_at).toLocaleTimeString(),
      'Platform': Array.isArray(post.platforms) ? post.platforms.join(', ') : post.platforms,
      'Status': post.status || 'unknown',
      'Caption': post.text ? post.text.substring(0, 100) + (post.text.length > 100 ? '...' : '') : '',
      'Has Media': post.image_url ? 'Yes' : 'No',
      'Image URL': post.image_url || '',
      'Scheduled For': post.schedule_time ? new Date(post.schedule_time).toLocaleString() : 'Posted immediately'
    }));

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for download
    const filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csv);

    console.log(`✅ Analytics exported for user ${userId}`);
  } catch (error) {
    console.error('Error in /api/analytics/export:', error);
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
app.post('/api/upload/image', verifyAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    const isVideo = req.file.mimetype.startsWith('video/');

    const userId = req.user.id;
    console.log(`📤 Uploading ${isVideo ? 'video' : 'image'} for user ${userId}...`);
    console.log(`   File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Storage: ${req.file.buffer ? 'memory' : 'disk'}`);

    // Upload to Cloudinary (handle both memory buffer and disk path)
    let result;
    if (req.file.buffer) {
      // Memory storage - upload buffer directly
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: isVideo ? 'video' : 'image',
            folder: `social-media-automator/${userId}`,
            transformation: isVideo ? [] : [
              { width: 1200, height: 630, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({ success: true, url: result.secure_url, publicId: result.public_id });
          }
        );
        uploadStream.end(req.file.buffer);
      });
    } else {
      // Disk storage - use path
      result = isVideo ? await uploadVideo(req.file.path, userId) : await uploadImage(req.file.path, userId);

      // Delete temporary file
      await fs.unlink(req.file.path).catch(err => {
        console.error('Error deleting temp file:', err);
      });
    }

    if (result.success) {
      console.log('✅ Image uploaded:', result.url);

      // Track usage (for billing limits later)
      await incrementUsage(userId, 'image_upload');

      return res.json({
        success: true,
        url: result.url,           // Standard field name
        imageUrl: result.url,       // Backward compatibility
        videoUrl: result.url,       // For video uploads
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
  console.log('📹 Video upload endpoint hit!');
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

/**
 * POST /api/ai/youtube-caption
 * Generate AI captions from URL (YouTube video or general web page) (protected)
 */
app.post('/api/ai/youtube-caption', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoUrl, instructions, platform } = req.body;

    // Validate inputs
    if (!videoUrl || videoUrl.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
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

    let content = '';
    let contentType = '';

    // Check if URL is YouTube or general web page
    if (isYouTubeUrl(videoUrl)) {
      console.log(`\n📺 YouTube caption request: url="${videoUrl}", platform="${platform}"`);
      contentType = 'YouTube video';

      // Step 1: Extract transcript from YouTube
      content = await extractTranscript(videoUrl);
    } else {
      console.log(`\n🌐 Web scrape caption request: url="${videoUrl}", platform="${platform}"`);
      contentType = 'web page';

      // Step 1: Scrape content from web page
      content = await scrapeWebContent(videoUrl);
    }

    console.log(`✅ Content extracted from ${contentType}: ${content.length} characters`);

    // Step 2: Generate captions from content
    const variations = await generateCaptionFromTranscript(
      content,
      instructions || '',
      platform || 'linkedin'
    );

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      variations,
      count: variations.length,
      contentLength: content.length,
      contentType
    });

  } catch (error) {
    console.error('Error in /api/ai/youtube-caption:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate captions from URL'
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

/**
 * POST /api/ai/hashtags
 * Generate AI hashtags for a post (protected)
 */
app.post('/api/ai/hashtags', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { caption, platform } = req.body;

    // Validate inputs
    if (!caption || caption.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Caption must be at least 10 characters'
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

    console.log(`🏷️  AI hashtag request for ${platform || 'default'} platform`);

    // Generate hashtags
    const hashtags = await generateHashtags(
      caption,
      platform || 'instagram'
    );

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      hashtags,
      count: hashtags.length,
      platform: platform || 'instagram'
    });

  } catch (error) {
    console.error('Error in /api/ai/hashtags:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate hashtags'
    });
  }
});

/**
 * POST /api/ai/content-ideas
 * Generate content ideas for a given topic and platform
 */
app.post('/api/ai/content-ideas', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, platform, count } = req.body;

    // Validate inputs
    if (!topic || topic.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Topic must be at least 3 characters'
      });
    }

    const ideaCount = count || 20;
    if (ideaCount < 5 || ideaCount > 50) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 5 and 50'
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

    console.log(`💡 Generating ${ideaCount} content ideas for "${topic}" on ${platform || 'linkedin'}`);

    // Generate content ideas
    const ideas = await generateContentIdeas(
      topic.trim(),
      platform || 'linkedin',
      ideaCount
    );

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      ideas,
      topic: topic.trim(),
      platform: platform || 'linkedin',
      count: ideas.length
    });

  } catch (error) {
    console.error('Error in /api/ai/content-ideas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate content ideas'
    });
  }
});

/**
 * POST /api/ai/improve-caption
 * Improve an existing caption with AI (4 variations)
 */
app.post('/api/ai/improve-caption', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { caption, platform } = req.body;

    // Validate inputs
    if (!caption || caption.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Caption must be at least 5 characters'
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

    console.log(`🎨 Improving caption for ${platform || 'linkedin'}`);

    // Improve caption
    const improved = await improveCaption(
      caption.trim(),
      platform || 'linkedin'
    );

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      original: caption.trim(),
      improved,
      platform: platform || 'linkedin'
    });

  } catch (error) {
    console.error('Error in /api/ai/improve-caption:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to improve caption'
    });
  }
});

/**
 * POST /api/ai/caption-from-image
 * Generate captions from image using Claude Vision
 */
app.post('/api/ai/caption-from-image', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrl, platform } = req.body;

    // Validate inputs
    if (!imageUrl || imageUrl.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
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

    console.log(`🖼️ Generating captions from image for ${platform || 'linkedin'}`);

    // Generate captions from image
    const result = await generateCaptionFromImage(
      imageUrl.trim(),
      platform || 'linkedin'
    );

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      description: result.description,
      captions: result.captions,
      platform: platform || 'linkedin',
      imageUrl: imageUrl.trim()
    });

  } catch (error) {
    console.error('Error in /api/ai/caption-from-image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate captions from image'
    });
  }
});

/**
 * POST /api/ai/variations
 * Generate platform-specific post variations
 */
app.post('/api/ai/variations', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { caption, platforms } = req.body;

    // Validate inputs
    if (!caption || caption.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Caption must be at least 10 characters'
      });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one platform is required'
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

    console.log(`🎨 Generating post variations for ${platforms.length} platforms`);

    // Generate platform-specific variations
    const variations = await generatePostVariations(caption, platforms);

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      variations,
      platforms,
      count: Object.keys(variations).length
    });

  } catch (error) {
    console.error('Error in /api/ai/variations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate post variations'
    });
  }
});

// ============================================
// CONTENT CREATION AGENT API ENDPOINTS
// ============================================

/**
 * POST /api/content-agent/generate
 * Generate AI content calendar for X days
 */
app.post('/api/content-agent/generate', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30, platforms = ['linkedin', 'twitter'], niches, contentMix } = req.body;

    console.log(`\n🤖 Generating ${days}-day content calendar for user ${userId}...`);

    const result = await generateContentCalendar(userId, days, {
      platforms,
      niches,
      contentMix
    });

    // Increment AI usage
    await incrementUsage(userId, 'ai', days); // Count as days * AI calls

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/generate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate content calendar'
    });
  }
});

/**
 * GET /api/content-agent/posts
 * Get AI-generated posts for user
 */
app.get('/api/content-agent/posts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    const posts = await getGeneratedPosts(userId, status, parseInt(limit));

    res.json({
      success: true,
      posts,
      count: posts.length
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/posts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch generated posts'
    });
  }
});

/**
 * POST /api/content-agent/approve/:id
 * Approve a generated post for scheduling
 */
app.post('/api/content-agent/approve/:id', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    console.log(`✅ Approving post ${postId} by user ${userId}`);

    const result = await approvePost(postId, userId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/approve:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve post'
    });
  }
});

/**
 * DELETE /api/content-agent/reject/:id
 * Reject a generated post
 */
app.delete('/api/content-agent/reject/:id', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    console.log(`❌ Rejecting post ${postId} by user ${userId}`);

    const result = await rejectPost(postId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/reject:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject post'
    });
  }
});

/**
 * GET /api/content-agent/trends
 * Get current trend alerts for user
 */
app.get('/api/content-agent/trends', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const trends = await getTrendAlerts(userId, parseInt(limit));

    res.json({
      success: true,
      trends,
      count: trends.length
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trends'
    });
  }
});

/**
 * POST /api/content-agent/trends/monitor
 * Monitor trends for user and create alerts
 */
app.post('/api/content-agent/trends/monitor', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { niches = ['business', 'technology'] } = req.body;

    console.log(`🔥 Monitoring trends for user ${userId}...`);

    const result = await monitorTrendsForUser(userId, niches);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/trends/monitor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to monitor trends'
    });
  }
});

/**
 * POST /api/content-agent/brand-voice/analyze
 * Analyze user's brand voice from post history
 */
app.post('/api/content-agent/brand-voice/analyze', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🎨 Analyzing brand voice for user ${userId}...`);

    const result = await analyzeBrandVoice(userId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/brand-voice/analyze:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze brand voice'
    });
  }
});

/**
 * GET /api/content-agent/brand-voice
 * Get user's brand voice profile
 */
app.get('/api/content-agent/brand-voice', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const brandVoice = await getBrandVoiceProfile(userId);

    if (!brandVoice) {
      return res.json({
        success: false,
        message: 'No brand voice profile found. Analyze your posts first.'
      });
    }

    res.json({
      success: true,
      brandVoice
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/brand-voice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch brand voice'
    });
  }
});

/**
 * POST /api/content-agent/keyword-trends
 * Fetch trending data for a specific keyword
 */
app.post('/api/content-agent/keyword-trends', verifyAuth, async (req, res) => {
  try {
    const { keyword, days = 7 } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required'
      });
    }

    console.log(`🔍 Fetching keyword trends for: "${keyword}"`);

    const trendingData = await fetchKeywordTrendingData(keyword, days);

    res.json({
      success: true,
      ...trendingData
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/keyword-trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch keyword trends'
    });
  }
});

/**
 * POST /api/content-agent/generate-from-keyword
 * Generate 7-day content calendar from a keyword with preview
 */
app.post('/api/content-agent/generate-from-keyword', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyword, days = 7, platforms = ['linkedin', 'twitter'] } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required'
      });
    }

    console.log(`\n🤖 Generating ${days}-day content from keyword "${keyword}" for user ${userId}...`);

    // 1. Fetch trending data about the keyword
    const trendingData = await fetchKeywordTrendingData(keyword, days);

    if (!trendingData.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to fetch data about "${keyword}": ${trendingData.error}`
      });
    }

    // 2. Generate content calendar with the keyword context
    const result = await generateContentCalendar(userId, days, {
      platforms,
      niches: [keyword],
      keywordContext: trendingData.context,
      focusKeyword: keyword
    });

    // 3. Increment AI usage
    await incrementUsage(userId, 'ai', days);

    // 4. Return preview with trending data context
    res.json({
      success: true,
      keyword,
      trendingContext: trendingData.context,
      relatedTrends: trendingData.relatedTrends.slice(0, 3),
      preview: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error in /api/content-agent/generate-from-keyword:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate content from keyword'
    });
  }
});

// ============================================
// NEWS AGENT ROUTES
// ============================================

/**
 * GET /api/news/trending
 * Get trending news categorized by topic
 */
app.get('/api/news/trending', verifyAuth, async (req, res) => {
  try {
    const { limit = 30, refresh = false } = req.query;

    console.log(`📰 Fetching trending news (refresh=${refresh})...`);

    // Prevent browser caching of news responses
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Use new fetchNewsByCategory function which returns pre-grouped news
    // bypass cache if refresh=true
    const grouped = await fetchNewsByCategory(refresh === 'true');

    // Calculate total articles
    const total = Object.values(grouped).reduce((sum, cat) => sum + cat.articles.length, 0);

    res.json({
      success: true,
      news: grouped,
      total: total,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in /api/news/trending:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trending news'
    });
  }
});

/**
 * GET /api/news/category/:category
 * Get news by specific category
 */
app.get('/api/news/category/:category', verifyAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    console.log(`📰 Fetching news for category: ${category}`);

    const news = await getNewsByCategory(category, parseInt(limit));

    res.json({
      success: true,
      category,
      news,
      total: Object.values(news).reduce((sum, cat) => sum + cat.articles.length, 0)
    });

  } catch (error) {
    console.error('❌ Error in /api/news/category:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch news'
    });
  }
});

/**
 * POST /api/news/search
 * Search for news about a specific keyword or topic
 */
app.post('/api/news/search', verifyAuth, async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required'
      });
    }

    console.log(`📰 Searching news for: "${keyword}"`);

    const result = await searchNews(keyword, parseInt(limit));

    res.json({
      success: result.success,
      ...result
    });

  } catch (error) {
    console.error('❌ Error in /api/news/search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search news'
    });
  }
});

/**
 * POST /api/news/generate-posts
 * Generate social media posts from a news article
 */
app.post('/api/news/generate-posts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { article, count = 1, multipleAngles = false, platforms = ['linkedin', 'twitter'] } = req.body;

    if (!article || !article.title) {
      return res.status(400).json({
        success: false,
        error: 'Article data required (title, description, url, source)'
      });
    }

    if (count < 1 || count > 10) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 1 and 10'
      });
    }

    console.log(`📰 POST /api/news/generate-posts - Generating ${count} posts from news`);

    const result = await generatePostsFromNews(
      userId,
      article,
      parseInt(count),
      multipleAngles,
      platforms
    );

    res.json({
      success: result.success,
      posts: result.posts || [],
      count: result.count || 0,
      totalRequested: result.totalRequested || count,
      generationTime: result.generationTime || 0,
      error: result.error || null
    });

  } catch (error) {
    console.error('❌ Error in /api/news/generate-posts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate posts from news'
    });
  }
});

// Helper function to determine category
function determineCategoryForArticle(article) {
  const NEWS_CATEGORIES = {
    ai: ['artificial intelligence', 'AI', 'machine learning', 'GPT', 'neural', 'deep learning', 'LLM'],
    stocks: ['stock market', 'crypto', 'bitcoin', 'nasdaq', 'market', 'trading', 'investment', 'finance'],
    sports: ['sports', 'cricket', 'football', 'soccer', 'basketball', 'tennis', 'game', 'match'],
    technology: ['tech', 'software', 'app', 'startup', 'cloud', 'data', 'digital'],
    business: ['business', 'company', 'economy', 'industry', 'corporate', 'entrepreneur'],
    entertainment: ['movie', 'music', 'celebrity', 'film', 'show', 'entertainment', 'actor']
  };

  const text = `${(article.title || '').toLowerCase()} ${(article.description || '').toLowerCase()}`;

  for (const [category, keywords] of Object.entries(NEWS_CATEGORIES)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'technology';
}

// ============================================
// ANALYTICS INSIGHTS AGENT ROUTES
// ============================================

/**
 * POST /api/analytics-agent/analyze
 * Analyze user patterns and generate insights
 */
app.post('/api/analytics-agent/analyze', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📊 Analyzing patterns and generating insights for user ${userId}...`);

    // Step 1: Analyze patterns
    const patternResult = await analyzeUserPatterns(userId);

    // Step 2: Generate AI insights
    const insightResult = await generateInsights(userId);

    res.json({
      success: true,
      ...patternResult,
      ...insightResult,
      message: 'Analysis complete'
    });

  } catch (error) {
    console.error('❌ Error in /api/analytics-agent/analyze:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze patterns'
    });
  }
});

/**
 * GET /api/analytics-agent/insights
 * Get active insights for user
 */
app.get('/api/analytics-agent/insights', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const insights = await getUserInsights(userId);

    res.json({
      success: true,
      insights,
      count: insights.length
    });

  } catch (error) {
    console.error('❌ Error in /api/analytics-agent/insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch insights'
    });
  }
});

/**
 * GET /api/analytics-agent/patterns
 * Get detected patterns for user
 */
app.get('/api/analytics-agent/patterns', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const patterns = await getUserPatterns(userId);

    res.json({
      success: true,
      patterns,
      count: patterns.length
    });

  } catch (error) {
    console.error('❌ Error in /api/analytics-agent/patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch patterns'
    });
  }
});

/**
 * POST /api/analytics-agent/score-draft
 * Score a draft post before publishing
 */
app.post('/api/analytics-agent/score-draft', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { caption, platforms = [], hasImage = false, hasVideo = false } = req.body;

    if (!caption || caption.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Caption is required'
      });
    }

    console.log(`⭐ Scoring draft post for user ${userId}...`);

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    const score = await scoreDraftPost(userId, caption, platforms, hasImage, hasVideo);

    res.json({
      success: true,
      score
    });

  } catch (error) {
    console.error('❌ Error in /api/analytics-agent/score-draft:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to score draft'
    });
  }
});

/**
 * PUT /api/analytics-agent/insights/:id/dismiss
 * Dismiss an insight
 */
app.put('/api/analytics-agent/insights/:id/dismiss', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const insightId = req.params.id;

    const { data, error } = await supabase
      .from('analytics_insights')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', insightId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Insight dismissed'
    });

  } catch (error) {
    console.error('❌ Error dismissing insight:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to dismiss insight'
    });
  }
});

/**
 * PUT /api/analytics-agent/insights/:id/viewed
 * Mark insight as viewed
 */
app.put('/api/analytics-agent/insights/:id/viewed', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const insightId = req.params.id;

    const { data, error } = await supabase
      .from('analytics_insights')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', insightId)
      .eq('user_id', userId)
      .is('viewed_at', null);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Insight marked as viewed'
    });

  } catch (error) {
    console.error('❌ Error marking insight as viewed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark insight as viewed'
    });
  }
});

// ============================================
// CONTENT RECYCLING ENGINE
// ============================================

/**
 * GET /api/content-recycling/settings
 * Get user's content recycling settings
 */
app.get('/api/content-recycling/settings', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await getRecyclingSettings(userId);

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('❌ Error getting recycling settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recycling settings'
    });
  }
});

/**
 * PUT /api/content-recycling/settings
 * Update user's content recycling settings
 */
app.put('/api/content-recycling/settings', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const settings = await updateRecyclingSettings(userId, updates);

    res.json({
      success: true,
      settings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating recycling settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update settings'
    });
  }
});

/**
 * GET /api/content-recycling/posts
 * Get recyclable posts for the user
 */
app.get('/api/content-recycling/posts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const { posts, settings } = await getRecyclablePosts(userId, limit);

    res.json({
      success: true,
      posts,
      settings,
      count: posts.length
    });

  } catch (error) {
    console.error('❌ Error getting recyclable posts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recyclable posts'
    });
  }
});

/**
 * POST /api/content-recycling/recycle/:postId
 * Manually recycle a specific post
 */
app.post('/api/content-recycling/recycle/:postId', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    const { platforms, scheduleTime } = req.body;

    console.log(`♻️  Manual recycle request for post ${postId}`);

    const options = {
      triggerType: 'manual'
    };

    if (platforms && platforms.length > 0) {
      options.platforms = platforms;
    }

    if (scheduleTime) {
      options.scheduleTime = new Date(scheduleTime);
    }

    const result = await recyclePost(userId, postId, options);

    res.json({
      success: true,
      message: 'Post recycled successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ Error recycling post:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to recycle post'
    });
  }
});

/**
 * POST /api/content-recycling/auto-recycle
 * Manually trigger auto-recycle (for testing or manual run)
 */
app.post('/api/content-recycling/auto-recycle', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🤖 Manual auto-recycle trigger for user ${userId}`);

    const result = await autoRecyclePosts(userId);

    res.json({
      success: true,
      message: 'Auto-recycle completed',
      ...result
    });

  } catch (error) {
    console.error('❌ Error in auto-recycle:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-recycle'
    });
  }
});

/**
 * GET /api/content-recycling/history
 * Get user's content recycling history
 */
app.get('/api/content-recycling/history', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const history = await getRecyclingHistory(userId, limit);

    res.json({
      success: true,
      history,
      count: history.length
    });

  } catch (error) {
    console.error('❌ Error getting recycling history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recycling history'
    });
  }
});

/**
 * GET /api/content-recycling/stats
 * Get recycling statistics for dashboard
 */
app.get('/api/content-recycling/stats', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await getRecyclingStats(userId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error getting recycling stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recycling stats'
    });
  }
});

// ============================================
// WEBHOOK NOTIFICATIONS
// ============================================

/**
 * GET /api/webhooks
 * Get all user webhooks
 */
app.get('/api/webhooks', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhooks = await getUserWebhooks(userId);

    res.json({
      success: true,
      webhooks,
      count: webhooks.length
    });

  } catch (error) {
    console.error('❌ Error getting webhooks:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get webhooks'
    });
  }
});

/**
 * POST /api/webhooks
 * Create a new webhook
 */
app.post('/api/webhooks', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhookData = req.body;

    const webhook = await createWebhook(userId, webhookData);

    res.json({
      success: true,
      webhook,
      message: 'Webhook created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create webhook'
    });
  }
});

/**
 * PUT /api/webhooks/:id
 * Update webhook
 */
app.put('/api/webhooks/:id', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhookId = parseInt(req.params.id);
    const updates = req.body;

    const webhook = await updateWebhook(userId, webhookId, updates);

    res.json({
      success: true,
      webhook,
      message: 'Webhook updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update webhook'
    });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete webhook
 */
app.delete('/api/webhooks/:id', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhookId = parseInt(req.params.id);

    await deleteWebhook(userId, webhookId);

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete webhook'
    });
  }
});

/**
 * POST /api/webhooks/:id/test
 * Test a webhook endpoint
 */
app.post('/api/webhooks/:id/test', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhookId = parseInt(req.params.id);

    const result = await testWebhook(userId, webhookId);

    res.json({
      success: result.success,
      message: result.success ? 'Webhook test successful!' : 'Webhook test failed',
      ...result
    });

  } catch (error) {
    console.error('❌ Error testing webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test webhook'
    });
  }
});

/**
 * GET /api/webhooks/logs
 * Get webhook logs
 */
app.get('/api/webhooks/logs', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const webhookId = req.query.webhook_id ? parseInt(req.query.webhook_id) : null;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await getWebhookLogs(userId, webhookId, limit);

    res.json({
      success: true,
      logs,
      count: logs.length
    });

  } catch (error) {
    console.error('❌ Error getting webhook logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get webhook logs'
    });
  }
});

/**
 * GET /api/webhooks/stats
 * Get webhook statistics
 */
app.get('/api/webhooks/stats', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await getWebhookStats(userId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error getting webhook stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get webhook stats'
    });
  }
});

/**
 * GET /api/webhooks/events
 * Get list of available webhook events
 */
app.get('/api/webhooks/events', verifyAuth, async (req, res) => {
  try {
    const events = [
      { value: 'post.success', label: 'Post Published Successfully', description: 'Triggered when a post is successfully published to all platforms' },
      { value: 'post.failed', label: 'Post Failed', description: 'Triggered when a post fails to publish' },
      { value: 'post.scheduled', label: 'Post Scheduled', description: 'Triggered when a new post is scheduled' },
      { value: 'post.recycled', label: 'Post Recycled', description: 'Triggered when content is auto-recycled' },
      { value: 'post.deleted', label: 'Post Deleted', description: 'Triggered when a scheduled post is deleted' },
      { value: 'content.generated', label: 'Content Generated', description: 'Triggered when AI generates new content' },
      { value: 'analytics.insight', label: 'Analytics Insight', description: 'Triggered when new analytics insights are available' }
    ];

    res.json({
      success: true,
      events
    });

  } catch (error) {
    console.error('❌ Error getting webhook events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// A/B TESTING ENGINE
// ============================================

/**
 * GET /api/ab-tests
 * Get all user's A/B tests
 */
app.get('/api/ab-tests', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || null;

    const tests = await getUserABTests(userId, status);

    res.json({
      success: true,
      tests,
      count: tests.length
    });

  } catch (error) {
    console.error('❌ Error getting A/B tests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get A/B tests'
    });
  }
});

/**
 * POST /api/ab-tests
 * Create new A/B test
 */
app.post('/api/ab-tests', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const testData = req.body;

    const result = await createABTest(userId, testData);

    res.json({
      success: true,
      message: 'A/B test created successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ Error creating A/B test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create A/B test'
    });
  }
});

/**
 * GET /api/ab-tests/:id/results
 * Get results for a specific test
 */
app.get('/api/ab-tests/:id/results', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = parseInt(req.params.id);

    const results = await getTestResults(userId, testId);

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('❌ Error getting test results:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get test results'
    });
  }
});

/**
 * POST /api/ab-tests/:id/declare-winner
 * Manually declare winner for a test
 */
app.post('/api/ab-tests/:id/declare-winner', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = parseInt(req.params.id);
    const { variation_id } = req.body;

    if (!variation_id) {
      return res.status(400).json({
        success: false,
        error: 'variation_id is required'
      });
    }

    const result = await declareWinner(userId, testId, variation_id);

    res.json({
      success: true,
      message: 'Winner declared successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ Error declaring winner:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to declare winner'
    });
  }
});

/**
 * POST /api/ab-tests/:id/cancel
 * Cancel an A/B test
 */
app.post('/api/ab-tests/:id/cancel', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = parseInt(req.params.id);

    await cancelTest(userId, testId);

    res.json({
      success: true,
      message: 'Test cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Error cancelling test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel test'
    });
  }
});

/**
 * GET /api/ab-tests/insights
 * Get A/B testing insights
 */
app.get('/api/ab-tests/insights', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const insights = await getABTestingInsights(userId);

    res.json({
      success: true,
      ...insights
    });

  } catch (error) {
    console.error('❌ Error getting A/B insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get insights'
    });
  }
});

// ============================================
// HASHTAG PERFORMANCE TRACKER
// ============================================

/**
 * GET /api/hashtags/analytics
 * Get hashtag analytics summary
 */
app.get('/api/hashtags/analytics', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = req.query.platform || null;

    const analytics = await getHashtagAnalytics(userId, platform);

    res.json({
      success: true,
      ...analytics
    });

  } catch (error) {
    console.error('❌ Error getting hashtag analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get hashtag analytics'
    });
  }
});

/**
 * GET /api/hashtags/top
 * Get top performing hashtags
 */
app.get('/api/hashtags/top', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = req.query.platform || null;
    const limit = parseInt(req.query.limit) || 20;

    const hashtags = await getTopHashtags(userId, platform, limit);

    res.json({
      success: true,
      hashtags,
      count: hashtags.length
    });

  } catch (error) {
    console.error('❌ Error getting top hashtags:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get top hashtags'
    });
  }
});

/**
 * GET /api/hashtags/worst
 * Get worst performing hashtags
 */
app.get('/api/hashtags/worst', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = req.query.platform || null;
    const limit = parseInt(req.query.limit) || 10;

    const hashtags = await getWorstHashtags(userId, platform, limit);

    res.json({
      success: true,
      hashtags,
      count: hashtags.length
    });

  } catch (error) {
    console.error('❌ Error getting worst hashtags:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get worst hashtags'
    });
  }
});

/**
 * GET /api/hashtags/suggestions
 * Get hashtag suggestions based on performance
 */
app.get('/api/hashtags/suggestions', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = req.query.platform || 'linkedin';
    const current = req.query.current ? req.query.current.split(',') : [];

    const suggestions = await getHashtagSuggestions(userId, platform, current);

    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('❌ Error getting hashtag suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get suggestions'
    });
  }
});

/**
 * POST /api/hashtags/analyze-trends
 * Analyze hashtag trends
 */
app.post('/api/hashtags/analyze-trends', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await analyzeHashtagTrends(userId);

    res.json({
      success: true,
      message: 'Trends analyzed successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ Error analyzing trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze trends'
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
      authUrl: authUrl.toString()
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
      return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_denied`);
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_missing_params`);
    }

    // Decrypt state to get userId
    let userId;
    try {
      userId = decryptState(state);
      console.log('  - Decrypted user ID:', userId);
    } catch (stateError) {
      console.error('State decryption error:', stateError.message);
      return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_invalid_state`);
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
      return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_token_exchange_failed`);
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
    // Use global supabaseAdmin instead of creating new client

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
    res.redirect(`${getFrontendUrl()}/connect-accounts?connected=linkedin&success=true`);
  } catch (error) {
    console.error('Error in LinkedIn callback:', error.message);
    res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_failed`);
  }
});

/**
 * POST /api/auth/reddit/url
 * Generate Reddit OAuth URL (authenticated endpoint)
 */
app.post('/api/auth/reddit/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = process.env.REDDIT_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'Reddit OAuth not configured. Please add REDDIT_CLIENT_ID to environment variables.'
      });
    }

    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/reddit/callback`;
    const oauthUrl = initiateRedditOAuth(userId, redirectUri);

    console.log('🔴 Reddit OAuth URL generated for user:', userId);

    res.json({
      success: true,
      oauthUrl: oauthUrl
    });
  } catch (error) {
    console.error('Error generating Reddit OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /auth/reddit/callback
 * Handle Reddit OAuth callback
 */
app.get('/auth/reddit/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    console.log('🔴 Reddit callback received');
    console.log('   Code:', code ? 'exists' : 'missing');
    console.log('   State:', state ? 'exists' : 'missing');
    console.log('   Error:', error || 'none');

    if (error) {
      console.error('Reddit OAuth error:', error);
      return res.redirect('/settings?error=reddit_denied');
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      return res.redirect('/settings?error=reddit_missing_params');
    }

    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/reddit/callback`;
    console.log('   Redirect URI:', redirectUri);

    const result = await handleRedditCallback(code, state, redirectUri);

    console.log('   Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Reddit OAuth callback successful');
      res.redirect('/settings?success=reddit');
    } else {
      console.error('❌ Reddit callback result was not success');
      res.redirect('/settings?error=reddit_failed');
    }
  } catch (error) {
    console.error('❌ Reddit callback error:', error);
    console.error('   Error details:', error.message);
    console.error('   Stack trace:', error.stack);
    res.redirect('/settings?error=reddit_callback_failed');
  }
});

/**
 * GET /api/reddit/subreddits
 * Get user's moderated subreddits (authenticated endpoint)
 */
app.get('/api/reddit/subreddits', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get Reddit account from database
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .select('platform_metadata, access_token')
      .eq('user_id', userId)
      .eq('platform', 'reddit')
      .eq('status', 'active')
      .single();

    if (error || !account) {
      return res.status(404).json({
        success: false,
        error: 'No Reddit account connected'
      });
    }

    // Parse moderated subreddits from metadata
    const subreddits = account.platform_metadata ? JSON.parse(account.platform_metadata) : [];

    res.json({
      success: true,
      subreddits: subreddits
    });

  } catch (error) {
    console.error('Error fetching Reddit subreddits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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

    // Also store in database for persistence across server restarts
    try {
      await supabaseAdmin
        .from('oauth_states')
        .insert({
          state: state,
          code_verifier: codeVerifier,
          user_id: userId,
          platform: 'twitter',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });
    } catch (dbError) {
      console.warn('Could not save PKCE to database:', dbError.message);
    }

    setTimeout(() => {
      pkceStore.delete(state);
      sessionPkceStore.delete(state);
    }, 30 * 60 * 1000);

    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;
    const scope = 'tweet.read tweet.write users.read offline.access tweet.moderate.write';

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
      authUrl: authUrl.toString()
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
      return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_denied`);
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_missing_params`);
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

    // If still not found, try database as last resort
    if (!pkceData) {
      console.log('  - Not found in memory, checking database...');
      try {
        const { data: dbState } = await supabaseAdmin
          .from('oauth_states')
          .select('*')
          .eq('state', state)
          .eq('platform', 'twitter')
          .gte('expires_at', new Date().toISOString())
          .single();

        if (dbState) {
          console.log('  - ✅ Found PKCE in database!');
          pkceData = {
            codeVerifier: dbState.code_verifier,
            userId: dbState.user_id,
            timestamp: Date.now()
          };
          // Clean up from database
          await supabaseAdmin.from('oauth_states').delete().eq('state', state);
        }
      } catch (dbErr) {
        console.error('  - Database lookup failed:', dbErr.message);
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
      return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_expired`);
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
      return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_token_exchange_failed`);
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

    // Store in database using global supabaseAdmin (bypasses RLS)
    // Check if we have OAuth 1.0a credentials in environment (API Key/Secret)
    // These are app-level credentials that all users can use for media uploads
    const oauth1Credentials = process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET
      ? {
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET
      }
      : null;

    console.log('  - OAuth 1.0a credentials available:', oauth1Credentials ? 'Yes' : 'No');

    // Check if ANY Twitter account for this user has OAuth 1.0a credentials
    // (needed because platform_user_id might change or account might be recreated)
    const { data: existingAccounts } = await supabaseAdmin
      .from('user_accounts')
      .select('refresh_token, platform_username')
      .eq('user_id', userId)
      .eq('platform', 'twitter');

    // Preserve OAuth 1.0a credentials if they exist in ANY Twitter account
    let finalRefreshToken = refresh_token;
    if (existingAccounts && existingAccounts.length > 0) {
      for (const account of existingAccounts) {
        if (account.refresh_token) {
          const isOAuth1Format = /^\d+-\w/.test(account.refresh_token);
          if (isOAuth1Format) {
            console.log(`   🔒 Preserving OAuth 1.0a credentials from account: ${account.platform_username}`);
            finalRefreshToken = account.refresh_token; // Keep OAuth 1.0a credentials
            break; // Use first OAuth 1.0a credentials found
          }
        }
      }
    }

    const { data: upsertResult, error: upsertError } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'twitter',
        platform_name: 'Twitter/X',
        oauth_provider: 'twitter',
        access_token: access_token,
        refresh_token: finalRefreshToken,
        token_expires_at: expiresAt?.toISOString(),
        platform_user_id: profile.id,
        platform_username: profile.username,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select();

    if (upsertError) {
      console.error('❌ Database upsert error:', upsertError);
      throw upsertError;
    }

    console.log('✅ Twitter account upserted:', upsertResult);

    // Verify the account is actually active (force update if needed)
    if (upsertResult && upsertResult.length > 0) {
      const accountId = upsertResult[0].id;
      const { error: verifyError } = await supabaseAdmin
        .from('user_accounts')
        .update({ status: 'active' })
        .eq('id', accountId);

      if (verifyError) {
        console.error('❌ Status update error:', verifyError);
      } else {
        console.log('✅ Status verified as active for account:', accountId);
      }
    }

    console.log(`✅ Twitter account connected for user ${userId}`);
    res.redirect(`${getFrontendUrl()}/connect-accounts?connected=twitter&success=true`);
  } catch (error) {
    console.error('Error in Twitter callback:', error.message);
    res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_failed`);
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
 * GET /api/user/profile
 * Get user profile including email preferences (protected)
 */
app.get('/api/user/profile', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, email_reports_enabled, report_email, report_frequency, metadata')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_reports_enabled: user.email_reports_enabled || false,
        report_email: user.report_email || user.email,
        report_frequency: user.report_frequency || 'weekly',
        metadata: user.metadata
      }
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/user/email-preferences
 * Update user email report preferences (protected)
 */
app.put('/api/user/email-preferences', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_reports_enabled, report_email, report_frequency } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        email_reports_enabled: email_reports_enabled || false,
        report_email: report_email || null,
        report_frequency: report_frequency || 'weekly'
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Email preferences updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Email preferences updated successfully',
      user: data
    });

  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// TEAM COLLABORATION ENDPOINTS
// =====================================================

/**
 * GET /api/workspace/info
 * Get current user's workspace information
 */
app.get('/api/workspace/info', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log(`🔍 Getting workspace for user ${userId} (${userEmail})`);

    let workspace = await getUserWorkspace(userId);

    // Auto-create workspace ONLY if user is not a member of ANY workspace
    if (!workspace) {
      // First check if user was invited to any workspace (check team_members table)
      const { data: existingMembership } = await supabaseAdmin
        .from('team_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (existingMembership) {
        console.log(`✅ User ${userId} is already a team member, re-fetching workspace...`);
        workspace = await getUserWorkspace(userId);
      } else {
        // User is not a member of any workspace, create a new one as Owner
        console.log(`🏗️ Creating new workspace for user ${userId} (Owner)`);

        // Create workspace
        const { data: newWorkspace, error: workspaceError } = await supabaseAdmin
          .from('workspaces')
          .insert({
            owner_id: userId,
            name: `${userEmail || 'My'}'s Workspace`
          })
          .select()
          .single();

        if (workspaceError) {
          console.error('Error creating workspace:', workspaceError);
          throw workspaceError;
        }

        // Add user as owner in team_members
        const { error: memberError } = await supabaseAdmin
          .from('team_members')
          .insert({
            workspace_id: newWorkspace.id,
            user_id: userId,
            role: 'owner',
            status: 'active',
            joined_at: new Date().toISOString()
          });

        if (memberError) {
          console.error('Error adding team member:', memberError);
          throw memberError;
        }

        console.log(`✅ Workspace created for user ${userId}`);

        // Fetch the newly created workspace
        workspace = await getUserWorkspace(userId);
      }
    }

    if (!workspace) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create or load workspace'
      });
    }

    console.log(`✅ Workspace loaded for user ${userId}:`, workspace);

    res.json({
      success: true,
      workspace
    });
  } catch (error) {
    console.error('Error getting workspace info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/workspace/name
 * Update workspace name (Owner only)
 */
app.put('/api/workspace/name', verifyAuth, requireRole('owner'), async (req, res) => {
  try {
    const { name } = req.body;
    const workspaceId = req.workspace.workspace_id;

    if (!name || name.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Workspace name is required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('workspaces')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw error;

    await logActivity(
      workspaceId,
      req.user.id,
      'workspace_renamed',
      'workspace',
      workspaceId,
      { new_name: name.trim() }
    );

    res.json({
      success: true,
      workspace: data
    });
  } catch (error) {
    console.error('Error updating workspace name:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/team/members
 * Get all team members for current workspace
 */
app.get('/api/team/members', verifyAuth, async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'No workspace found'
      });
    }

    const { data: members, error } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('workspace_id', workspace.workspace_id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
        return {
          ...member,
          email: userData?.user?.email,
          name: userData?.user?.user_metadata?.full_name || userData?.user?.email?.split('@')[0]
        };
      })
    );

    res.json({
      success: true,
      members: membersWithDetails
    });
  } catch (error) {
    console.error('Error getting team members:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/team/invite
 * Invite a new team member (Owner/Admin only)
 */
app.post('/api/team/invite', verifyAuth, requirePermission('invite_member'), async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await getUserWorkspace(req.user.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'No workspace found'
      });
    }

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required'
      });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be admin, editor, or viewer'
      });
    }

    const invitation = await createInvitation(
      workspace.workspace_id,
      email,
      role,
      req.user.id
    );

    res.json({
      success: true,
      invitation,
      message: `Invitation sent to ${email}`
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/team/invitations
 * Get pending invitations for current workspace
 */
app.get('/api/team/invitations', verifyAuth, requireRole('admin'), async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.id);
    const invitations = await getPendingInvitations(workspace.workspace_id);

    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/team/invitations/:id
 * Cancel a pending invitation
 */
app.delete('/api/team/invitations/:id', verifyAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await cancelInvitation(id, req.user.id);

    res.json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/team/invitations/:id/resend
 * Resend an invitation email
 */
app.post('/api/team/invitations/:id/resend', verifyAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await resendInvitation(id);

    res.json({
      success: true,
      message: 'Invitation resent'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/team/accept-invite
 * Accept a team invitation (public endpoint)
 */
app.post('/api/team/accept-invite', verifyAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is required'
      });
    }

    const teamMember = await acceptInvitation(token, req.user.id);

    res.json({
      success: true,
      teamMember,
      message: 'Successfully joined workspace'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/team/members/:userId
 * Remove a team member (Owner only)
 */
app.delete('/api/team/members/:userId', verifyAuth, requireRole('owner'), async (req, res) => {
  try {
    const { userId } = req.params;
    const workspace = await getUserWorkspace(req.user.id);

    // Cannot remove the owner
    if (userId === workspace.workspace.owner_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove workspace owner'
      });
    }

    // Get member info before deletion for activity log
    const { data: member } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('workspace_id', workspace.workspace_id)
      .eq('user_id', userId)
      .single();

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Remove member
    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('workspace_id', workspace.workspace_id)
      .eq('user_id', userId);

    if (error) throw error;

    await logActivity(
      workspace.workspace_id,
      req.user.id,
      'member_removed',
      'member',
      userId,
      { removed_user: userData?.user?.email }
    );

    res.json({
      success: true,
      message: 'Team member removed'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/team/members/:userId/role
 * Change a team member's role (Owner only)
 */
app.put('/api/team/members/:userId/role', verifyAuth, requireRole('owner'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const workspace = await getUserWorkspace(req.user.id);

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    // Cannot change owner's role
    if (userId === workspace.workspace.owner_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change owner role'
      });
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

    const { error } = await supabaseAdmin
      .from('team_members')
      .update({ role })
      .eq('workspace_id', workspace.workspace_id)
      .eq('user_id', userId);

    if (error) throw error;

    await logActivity(
      workspace.workspace_id,
      req.user.id,
      'role_changed',
      'member',
      userId,
      { target_user: userData?.user?.email, new_role: role }
    );

    res.json({
      success: true,
      message: 'Role updated'
    });
  } catch (error) {
    console.error('Error changing role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/activity
 * Get activity feed for current workspace
 */
app.get('/api/activity', verifyAuth, async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.id);
    const limit = parseInt(req.query.limit) || 50;

    const activities = await getActivityFeed(workspace.workspace_id, limit);

    // Format each activity for display
    const formattedActivities = activities.map(activity => ({
      ...activity,
      formatted: formatActivity(activity)
    }));

    res.json({
      success: true,
      activities: formattedActivities
    });
  } catch (error) {
    console.error('Error getting activity feed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/posts/submit-for-review
 * Submit a draft post for review (Editor role)
 */
app.post('/api/posts/submit-for-review', verifyAuth, requireRole('editor'), async (req, res) => {
  try {
    const { postId } = req.body;
    const workspace = await getUserWorkspace(req.user.id);

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID is required'
      });
    }

    // Update post approval status
    const { error: queueError } = await supabaseAdmin
      .from('queue')
      .update({ approval_status: 'pending_review' })
      .eq('id', postId)
      .eq('workspace_id', workspace.workspace_id)
      .eq('created_by', req.user.id);

    if (queueError) throw queueError;

    // Create approval record
    const { data: approval, error: approvalError } = await supabaseAdmin
      .from('post_approvals')
      .insert({
        post_id: postId,
        submitted_by: req.user.id,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (approvalError) throw approvalError;

    // Get post details for notification
    const { data: post } = await supabaseAdmin
      .from('queue')
      .select('text, platforms')
      .eq('id', postId)
      .single();

    await logActivity(
      workspace.workspace_id,
      req.user.id,
      'post_submitted',
      'post',
      postId.toString(),
      { post_title: post?.text?.substring(0, 50) }
    );

    // Send email notification to workspace owner/admins
    try {
      // Get workspace members with owner/admin roles
      const { data: members } = await supabaseAdmin
        .from('workspace_members')
        .select('user_id, role')
        .eq('workspace_id', workspace.workspace_id)
        .in('role', ['owner', 'admin']);

      if (members && members.length > 0) {
        // Get submitter info
        const { data: { user: submitterData } } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const submitterName = submitterData?.user_metadata?.name || submitterData?.email?.split('@')[0] || 'A team member';

        // Get admin/owner emails
        const adminIds = members.map(m => m.user_id);
        const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers();
        const adminEmails = adminUsers.users
          .filter(u => adminIds.includes(u.id))
          .map(u => u.email)
          .filter(Boolean);

        // Send notification to each admin
        const dashboardUrl = process.env.DASHBOARD_URL || 'https://socialmediaautomator.com';
        const postData = {
          postTitle: post?.text?.substring(0, 100) || 'New post',
          platforms: post?.platforms || []
        };

        for (const adminEmail of adminEmails) {
          await sendPostSubmissionNotification(adminEmail, postData, submitterName, dashboardUrl)
            .catch(err => console.warn('Failed to send submission notification:', err.message));
        }
      }
    } catch (emailError) {
      console.warn('Error sending post submission notifications:', emailError.message);
      // Don't fail the entire request if email fails
    }

    res.json({
      success: true,
      approval,
      message: 'Post submitted for review'
    });
  } catch (error) {
    console.error('Error submitting post for review:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/posts/pending-approvals
 * Get posts awaiting approval (Owner/Admin only)
 */
app.get('/api/posts/pending-approvals', verifyAuth, requirePermission('approve_post'), async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.id);

    // Get pending approvals with post details
    const { data: approvals, error } = await supabaseAdmin
      .from('post_approvals')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    // Get full post details for each approval
    const approvalsWithPosts = await Promise.all(
      approvals.map(async (approval) => {
        const { data: post } = await supabaseAdmin
          .from('queue')
          .select('*')
          .eq('id', approval.post_id)
          .eq('workspace_id', workspace.workspace_id)
          .single();

        const { data: submitterData } = await supabaseAdmin.auth.admin.getUserById(approval.submitted_by);

        return {
          ...approval,
          post,
          submitter: {
            email: submitterData?.user?.email,
            name: submitterData?.user?.user_metadata?.full_name || submitterData?.user?.email?.split('@')[0]
          }
        };
      })
    );

    res.json({
      success: true,
      approvals: approvalsWithPosts.filter(a => a.post !== null)
    });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/posts/:id/approve
 * Approve a post (Owner/Admin only)
 */
app.post('/api/posts/:id/approve', verifyAuth, requirePermission('approve_post'), async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await getUserWorkspace(req.user.id);

    // Update approval record
    const { data: approval, error: approvalError } = await supabaseAdmin
      .from('post_approvals')
      .update({
        status: 'approved',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('post_id', parseInt(id))
      .eq('status', 'pending')
      .select()
      .single();

    if (approvalError) throw approvalError;

    // Update post status
    const { error: queueError } = await supabaseAdmin
      .from('queue')
      .update({ approval_status: 'approved' })
      .eq('id', parseInt(id));

    if (queueError) throw queueError;

    // Get post details
    const { data: post } = await supabaseAdmin
      .from('queue')
      .select('text')
      .eq('id', parseInt(id))
      .single();

    await logActivity(
      workspace.workspace_id,
      req.user.id,
      'post_approved',
      'post',
      id,
      { post_title: post?.text?.substring(0, 50) }
    );

    // Send approval notification to post creator
    try {
      const { data: approvalData } = await supabaseAdmin
        .from('post_approvals')
        .select('submitted_by')
        .eq('post_id', parseInt(id))
        .single();

      if (approvalData?.submitted_by) {
        const { data: creatorData } = await supabaseAdmin.auth.admin.getUserById(approvalData.submitted_by);
        const creatorEmail = creatorData?.user?.email;
        const { data: approverData } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const approverName = approverData?.user?.user_metadata?.name || approverData?.user?.email?.split('@')[0] || 'Workspace Admin';

        if (creatorEmail) {
          const dashboardUrl = process.env.DASHBOARD_URL || 'https://socialmediaautomator.com';
          const postData = {
            postTitle: post?.text?.substring(0, 100) || 'Your post'
          };

          await sendPostApprovalNotification(creatorEmail, postData, approverName, dashboardUrl)
            .catch(err => console.warn('Failed to send approval notification:', err.message));
        }
      }
    } catch (emailError) {
      console.warn('Error sending approval notification:', emailError.message);
      // Don't fail the entire request if email fails
    }

    res.json({
      success: true,
      message: 'Post approved'
    });
  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/posts/:id/reject
 * Reject a post with feedback (Owner/Admin only)
 */
app.post('/api/posts/:id/reject', verifyAuth, requirePermission('approve_post'), async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const workspace = await getUserWorkspace(req.user.id);

    // Update approval record
    const { error: approvalError } = await supabaseAdmin
      .from('post_approvals')
      .update({
        status: 'rejected',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        feedback: feedback || 'Post rejected'
      })
      .eq('post_id', parseInt(id))
      .eq('status', 'pending');

    if (approvalError) throw approvalError;

    // Update post status
    const { error: queueError } = await supabaseAdmin
      .from('queue')
      .update({ approval_status: 'rejected' })
      .eq('id', parseInt(id));

    if (queueError) throw queueError;

    // Get post details
    const { data: post } = await supabaseAdmin
      .from('queue')
      .select('text')
      .eq('id', parseInt(id))
      .single();

    await logActivity(
      workspace.workspace_id,
      req.user.id,
      'post_rejected',
      'post',
      id,
      { post_title: post?.text?.substring(0, 50), feedback }
    );

    // Send rejection notification to post creator
    try {
      const { data: approvalData } = await supabaseAdmin
        .from('post_approvals')
        .select('submitted_by')
        .eq('post_id', parseInt(id))
        .single();

      if (approvalData?.submitted_by) {
        const { data: creatorData } = await supabaseAdmin.auth.admin.getUserById(approvalData.submitted_by);
        const creatorEmail = creatorData?.user?.email;
        const { data: rejecterData } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const rejecterName = rejecterData?.user?.user_metadata?.name || rejecterData?.user?.email?.split('@')[0] || 'Workspace Admin';

        if (creatorEmail) {
          const dashboardUrl = process.env.DASHBOARD_URL || 'https://socialmediaautomator.com';
          const postData = {
            postTitle: post?.text?.substring(0, 100) || 'Your post'
          };

          await sendPostRejectionNotification(creatorEmail, postData, feedback || '', rejecterName, dashboardUrl)
            .catch(err => console.warn('Failed to send rejection notification:', err.message));
        }
      }
    } catch (emailError) {
      console.warn('Error sending rejection notification:', emailError.message);
      // Don't fail the entire request if email fails
    }

    res.json({
      success: true,
      message: 'Post rejected'
    });
  } catch (error) {
    console.error('Error rejecting post:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/posts/:id/request-changes
 * Request changes on a post (Owner/Admin only)
 */
app.post('/api/posts/:id/request-changes', verifyAuth, requirePermission('approve_post'), async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const workspace = await getUserWorkspace(req.user.id);

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback is required when requesting changes'
      });
    }

    // Update approval record
    const { error: approvalError } = await supabaseAdmin
      .from('post_approvals')
      .update({
        status: 'changes_requested',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        feedback
      })
      .eq('post_id', parseInt(id))
      .eq('status', 'pending');

    if (approvalError) throw approvalError;

    // Update post status back to draft
    const { error: queueError } = await supabaseAdmin
      .from('queue')
      .update({ approval_status: 'draft' })
      .eq('id', parseInt(id));

    if (queueError) throw queueError;

    // Get post details
    const { data: post } = await supabaseAdmin
      .from('queue')
      .select('text')
      .eq('id', parseInt(id))
      .single();

    await logActivity(
      workspace.workspace_id,
      req.user.id,
      'changes_requested',
      'post',
      id,
      { post_title: post?.text?.substring(0, 50), feedback }
    );

    // Send changes requested notification to post creator
    try {
      const { data: approvalData } = await supabaseAdmin
        .from('post_approvals')
        .select('submitted_by')
        .eq('post_id', parseInt(id))
        .single();

      if (approvalData?.submitted_by) {
        const { data: creatorData } = await supabaseAdmin.auth.admin.getUserById(approvalData.submitted_by);
        const creatorEmail = creatorData?.user?.email;
        const { data: requesterData } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
        const requesterName = requesterData?.user?.user_metadata?.name || requesterData?.user?.email?.split('@')[0] || 'Workspace Admin';

        if (creatorEmail) {
          const dashboardUrl = process.env.DASHBOARD_URL || 'https://socialmediaautomator.com';
          const postData = {
            postTitle: post?.text?.substring(0, 100) || 'Your post'
          };

          await sendChangesRequestedNotification(creatorEmail, postData, feedback || '', requesterName, dashboardUrl)
            .catch(err => console.warn('Failed to send changes requested notification:', err.message));
        }
      }
    } catch (emailError) {
      console.warn('Error sending changes requested notification:', emailError.message);
      // Don't fail the entire request if email fails
    }

    res.json({
      success: true,
      message: 'Changes requested'
    });
  } catch (error) {
    console.error('Error requesting changes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/posts/drafts
 * Get user's draft posts
 */
app.get('/api/posts/drafts', verifyAuth, async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.id);

    const { data: drafts, error } = await supabaseAdmin
      .from('queue')
      .select('*')
      .eq('workspace_id', workspace.workspace_id)
      .eq('created_by', req.user.id)
      .in('approval_status', ['draft', 'changes_requested'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      drafts: drafts || []
    });
  } catch (error) {
    console.error('Error getting drafts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/count
 * Get unread notification count (for Owner/Admin)
 */
app.get('/api/notifications/count', verifyAuth, async (req, res) => {
  try {
    const workspace = await getUserWorkspace(req.user.id);
    const hasPermission = await checkPermission(req.user.id, 'approve_post');

    if (!hasPermission) {
      return res.json({
        success: true,
        count: 0
      });
    }

    const count = await getPendingApprovalsCount(workspace.workspace_id);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting notification count:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// END TEAM COLLABORATION ENDPOINTS
// =====================================================

// =====================================================
// VIDEO LIBRARY ENDPOINTS (Pexels Stock Videos)
// =====================================================

/**
 * GET /api/videos/search
 * Search for stock videos on Pexels (FREE, unlimited)
 */
app.get('/api/videos/search', verifyAuth, async (req, res) => {
  try {
    const { q, orientation, page, per_page } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    // Check if Pexels API is configured
    if (!process.env.PEXELS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Pexels API not configured. Get a free API key from https://www.pexels.com/api/'
      });
    }

    const result = await searchVideos(
      q.trim(),
      parseInt(per_page) || 15,
      orientation || null,
      parseInt(page) || 1
    );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error in /api/videos/search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search videos'
    });
  }
});

/**
 * GET /api/videos/popular
 * Get popular/trending videos from Pexels
 */
app.get('/api/videos/popular', verifyAuth, async (req, res) => {
  try {
    const { per_page } = req.query;

    const result = await getPopularVideos(parseInt(per_page) || 15);

    res.json({
      success: true,
      videos: result.videos || [],
      total: result.total_results || 0
    });

  } catch (error) {
    console.error('Error in /api/videos/popular:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get popular videos'
    });
  }
});

/**
 * GET /api/videos/validate-key
 * Check if Pexels API key is configured and valid
 */
app.get('/api/videos/validate-key', verifyAuth, async (req, res) => {
  try {
    const validation = await validatePexelsKey();

    res.json({
      success: validation.valid,
      configured: !!process.env.PEXELS_API_KEY,
      error: validation.error || null
    });

  } catch (error) {
    console.error('Error validating Pexels key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// END VIDEO LIBRARY ENDPOINTS
// =====================================================

// =====================================================
// CAROUSEL POSTS ENDPOINTS (Multi-Image Posts)
// =====================================================

/**
 * POST /api/carousel/upload
 * Upload multiple images for carousel post
 */
app.post('/api/carousel/upload', verifyAuth, upload.array('images', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least 2 images for carousel (minimum required)'
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 images allowed per carousel'
      });
    }

    console.log(`📤 Uploading ${files.length} carousel images to Cloudinary...`);

    // Upload all images to Cloudinary
    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'carousel-posts',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    console.log(`✅ Uploaded ${imageUrls.length} carousel images successfully`);

    res.json({
      success: true,
      images: imageUrls,
      count: imageUrls.length,
      message: `${imageUrls.length} images uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading carousel images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload carousel images'
    });
  }
});

/**
 * POST /api/carousel/generate-captions
 * Generate AI captions for carousel slides using Claude Vision
 */
app.post('/api/carousel/generate-captions', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrls, topic, platform } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least 2 image URLs for carousel'
      });
    }

    if (imageUrls.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 images allowed per carousel'
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

    console.log(`🤖 Generating AI captions for ${imageUrls.length}-slide carousel...`);

    const captions = await generateCarouselCaptions(
      imageUrls,
      topic || 'carousel post',
      platform || 'linkedin'
    );

    // Increment AI usage
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      captions,
      count: captions.length,
      slideCount: imageUrls.length
    });

  } catch (error) {
    console.error('Error generating carousel captions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate carousel captions'
    });
  }
});

/**
 * POST /api/carousel/post
 * Post carousel to social media platforms
 */
app.post('/api/carousel/post', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageUrls, captions, platforms, topic } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least 2 images for carousel'
      });
    }

    if (!platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least one platform'
      });
    }

    if (!captions || captions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide captions for the carousel'
      });
    }

    // Validate platforms support carousels
    const supportedPlatforms = ['linkedin', 'instagram'];
    const unsupported = platforms.filter(p => !supportedPlatforms.includes(p));
    if (unsupported.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Carousel not supported on: ${unsupported.join(', ')}. Only LinkedIn and Instagram support carousels.`
      });
    }

    console.log(`📸 Posting ${imageUrls.length}-slide carousel to ${platforms.join(', ')}...`);
    console.log('User ID:', userId);
    console.log('Platforms:', platforms);

    // Get user credentials (use same method as regular posting)
    const credentials = await getUserCredentialsForPosting(userId);

    console.log('Credentials fetched:', Object.keys(credentials));

    // Check if LinkedIn account exists
    if (platforms.includes('linkedin')) {
      if (!credentials.linkedin || credentials.linkedin.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No LinkedIn account connected. Please connect your LinkedIn account in Connect Accounts.'
        });
      }
    }

    // Check if Instagram account exists
    if (platforms.includes('instagram')) {
      if (!credentials.instagram || credentials.instagram.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No Instagram account connected. Please connect your Instagram account in Connect Accounts.'
        });
      }
    }

    const results = [];

    // Post to each platform
    for (const platform of platforms) {
      try {
        let result;

        if (platform === 'linkedin' && credentials.linkedin) {
          // Post to all LinkedIn accounts
          for (const linkedinAccount of credentials.linkedin) {
            try {
              result = await postLinkedInCarousel(imageUrls, captions, linkedinAccount);

              results.push({
                platform: 'linkedin',
                success: result.success,
                postId: result.postId,
                url: result.url,
                error: result.error
              });

              if (result.success) {
                console.log(`✅ Carousel posted to LinkedIn`);
              } else {
                console.log(`❌ LinkedIn carousel failed:`, result.error);
              }
            } catch (err) {
              console.error(`Failed to post carousel to LinkedIn:`, err);
              results.push({
                platform: 'linkedin',
                success: false,
                error: err.message
              });
            }
          }
        } else if (platform === 'instagram') {
          // Instagram carousel will be implemented in Phase 2
          results.push({
            platform: 'instagram',
            success: false,
            error: 'Instagram carousel coming soon! Use LinkedIn for now.'
          });
        }

      } catch (error) {
        console.error(`Failed to post carousel to ${platform}:`, error);
        results.push({
          platform: platform,
          success: false,
          error: error.message
        });
      }
    }

    // Save to analytics
    const carouselMetadata = formatCarouselMetadata({
      images: imageUrls,
      captions,
      captionMode: captions.length === 1 ? 'single' : 'per-slide'
    });

    // Ensure text is never null/empty for database
    const captionText = (captions.find(c => c && c.trim()) || 'Carousel post with ' + imageUrls.length + ' slides').trim();

    // Save to posts table (same as regular posts)
    try {
      const { data: postEntry, error: postError } = await supabaseAdmin
        .from('posts')
        .insert([{
          user_id: userId,
          text: captionText,
          image_url: imageUrls[0],
          platforms: platforms,
          status: 'posted',
          created_at: new Date().toISOString(),
          posted_at: new Date().toISOString(),
          post_metadata: carouselMetadata
        }])
        .select()
        .single();

      if (postError) {
        console.error('❌ Failed to save carousel to database:', postError);
      } else {
        console.log('✅ Carousel saved to posts table (ID:', postEntry.id, ')');
      }
    } catch (saveErr) {
      console.error('❌ Post save error:', saveErr);
      // Don't fail the whole request if saving fails
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: successCount > 0,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount
      },
      message: successCount > 0
        ? `Carousel posted successfully to ${successCount} platform(s)!`
        : 'Failed to post carousel to any platform'
    });

  } catch (error) {
    console.error('Error posting carousel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to post carousel'
    });
  }
});

// =====================================================
// END CAROUSEL POSTS ENDPOINTS
// =====================================================

/**
 * POST /api/auth/instagram/url
 * Generate Instagram OAuth URL (authenticated endpoint)
 */
app.post('/api/auth/instagram/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { initiateInstagramOAuth } = require('./services/oauth');

    console.log('📱 Instagram OAuth URL generation (Facebook Login):');
    console.log('  - User ID:', userId);

    // Use the fixed Instagram OAuth function (uses Facebook Login)
    const authUrl = initiateInstagramOAuth(userId);

    console.log('  - OAuth URL:', authUrl);

    res.json({
      success: true,
      authUrl: authUrl.toString()
    });

  } catch (error) {
    console.error('Error generating Instagram OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /auth/instagram/callback
 * Handle Instagram OAuth callback
 */
app.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    console.log('📱 Instagram callback received:');
    console.log('  - Code:', code ? 'exists' : 'missing');
    console.log('  - State:', state ? 'exists' : 'missing');
    console.log('  - Error:', error || 'none');

    if (error) {
      console.error('  ❌ OAuth error:', error);
      return res.redirect('/dashboard?error=instagram_denied');
    }

    if (!code || !state) {
      console.error('  ❌ Missing code or state');
      return res.redirect('/dashboard?error=instagram_invalid_callback');
    }

    // Handle Instagram callback (state decoding happens inside the function)
    try {
      const { handleInstagramCallback } = require('./services/oauth');
      const result = await handleInstagramCallback(code, state);

      console.log('  ✅ Instagram account connected successfully');
      console.log('  - Account:', result.account);

      return res.redirect('/connect-accounts?instagram=connected');

    } catch (callbackError) {
      console.error('  ❌ Instagram callback error:', callbackError.message);
      return res.redirect(`/dashboard?error=instagram_failed&message=${encodeURIComponent(callbackError.message)}`);
    }

  } catch (error) {
    console.error('Error handling Instagram callback:', error);
    return res.redirect('/dashboard?error=instagram_failed');
  }
});

/**
 * POST /api/auth/facebook/url
 * Generate Facebook OAuth URL
 */
app.post('/api/auth/facebook/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { initiateFacebookOAuth } = require('./services/oauth');

    console.log('📘 Facebook OAuth URL request from user:', userId);

    const oauthUrl = initiateFacebookOAuth(userId);

    console.log('  - OAuth URL:', oauthUrl);

    res.json({
      success: true,
      oauthUrl
    });

  } catch (error) {
    console.error('Error generating Facebook OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /auth/facebook/callback
 * Handle Facebook OAuth callback
 */
app.get('/auth/facebook/callback', async (req, res) => {
  try {
    const { code, state, error, error_code, error_message, error_reason } = req.query;

    console.log('📘 Facebook OAuth callback received');
    console.log('  - Code:', code ? code.substring(0, 20) + '...' : 'missing');
    console.log('  - State:', state ? state.substring(0, 20) + '...' : 'missing');
    console.log('  - Error:', error || 'none');
    console.log('  - Error Code:', error_code || 'none');
    console.log('  - Error Message:', error_message || 'none');
    console.log('  - Error Reason:', error_reason || 'none');
    console.log('  - Full Query:', JSON.stringify(req.query, null, 2));

    if (error) {
      console.log('  ❌ Facebook denied access:', error);
      console.log('  ❌ Error details:', { error_code, error_message, error_reason });
      return res.redirect(`/connect-accounts?error=facebook_denied&message=${encodeURIComponent(error_message || error)}`);
    }

    if (!code || !state) {
      console.log('  ❌ Missing code or state');
      console.log('  ❌ Query params:', req.query);
      return res.redirect('/connect-accounts?error=facebook_failed&message=Missing+authorization+code');
    }

    const { handleFacebookCallback } = require('./services/oauth');

    console.log('📘 Starting Facebook callback handler...');

    try {
      const result = await handleFacebookCallback(code, state);

      console.log('📘 Callback result:', JSON.stringify(result, null, 2));

      if (result.success && result.accounts && result.accounts.length > 0) {
        console.log('  ✅ Facebook connected successfully:', result.accounts.length, 'Pages');
        return res.redirect('/connect-accounts?facebook=connected');
      } else {
        console.log('  ⚠️  No Pages saved');
        return res.redirect('/connect-accounts?error=facebook_no_pages&message=No+Facebook+Pages+found.+Please+create+a+Facebook+Page+first.');
      }

    } catch (callbackError) {
      console.error('  ❌ Facebook callback error:', callbackError.message);
      console.error('  ❌ Full error:', callbackError);

      // Extract detailed error message
      let errorMsg = callbackError.message;
      if (callbackError.response?.data?.error) {
        errorMsg = callbackError.response.data.error.message || errorMsg;
      }

      return res.redirect(`/connect-accounts?error=facebook_failed&message=${encodeURIComponent(errorMsg)}`);
    }

  } catch (error) {
    console.error('Error handling Facebook callback:', error);
    console.error('Full error:', error);
    return res.redirect(`/connect-accounts?error=facebook_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
});

/**
 * POST /api/auth/twitter/oauth1
 * Add OAuth 1.0a Access Token/Secret for media uploads (authenticated endpoint)
 */
app.post('/api/auth/twitter/oauth1', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accessToken, accessSecret } = req.body;

    console.log('🔑 Adding Twitter OAuth 1.0a credentials for user:', userId);

    if (!accessToken || !accessSecret) {
      return res.status(400).json({
        success: false,
        error: 'Access Token and Secret are required'
      });
    }

    // Update existing Twitter account with OAuth 1.0a credentials
    // Use global supabaseAdmin instead of creating new client

    // Get existing Twitter account
    const { data: existingAccount } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'twitter')
      .single();

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        error: 'Twitter account not found. Please connect Twitter first.'
      });
    }

    // Store OAuth 1.0a credentials in refresh_token field
    // Format: oauth2_refresh_token:oauth1_access_token:oauth1_access_secret
    const newRefreshToken = existingAccount.refresh_token
      ? `${existingAccount.refresh_token}:${accessToken}:${accessSecret}`
      : `${accessToken}:${accessSecret}`;

    // Update account with OAuth 1.0a credentials in refresh_token
    const { error } = await supabaseAdmin
      .from('user_accounts')
      .update({
        refresh_token: newRefreshToken
      })
      .eq('id', existingAccount.id);

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Twitter OAuth 1.0a credentials added for user', userId);
    res.json({
      success: true,
      message: 'OAuth 1.0a credentials added successfully'
    });

  } catch (error) {
    console.error('Error adding Twitter OAuth 1.0a credentials:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/telegram/connect
 * Connect Telegram bot (userencia provides bot token)
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

    // Store in database using global supabaseAdmin (bypasses RLS)

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
 * POST /api/auth/slack/connect
 * Connect Slack workspace via incoming webhook
 */
app.post('/api/auth/slack/connect', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { webhookUrl, channelName } = req.body;

    console.log('💬 Connecting Slack webhook for user:', userId);

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required'
      });
    }

    // Validate webhook
    const validation = await validateWebhook(webhookUrl);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid webhook URL'
      });
    }

    // Store in database using global supabaseAdmin (bypasses RLS)
    const insertData = {
      user_id: userId,
      platform: 'slack',
      platform_name: channelName || 'Slack',
      oauth_provider: 'webhook',
      access_token: webhookUrl,
      platform_user_id: webhookUrl.substring(0, 50), // Use truncated webhook as ID
      platform_username: channelName || 'Slack Workspace',
      status: 'active',
      connected_at: new Date().toISOString()
    };

    console.log('📝 Inserting Slack webhook:', JSON.stringify({ ...insertData, access_token: '***' }, null, 2));

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

    console.log('✅ Slack webhook connected for user', userId);
    res.json({
      success: true,
      message: 'Slack connected successfully',
      channel: channelName || 'Slack'
    });

  } catch (error) {
    console.error('Error connecting Slack:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/discord/connect
 * Connect Discord server via incoming webhook
 */
app.post('/api/auth/discord/connect', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { webhookUrl, serverName } = req.body;

    console.log('🎮 Connecting Discord webhook for user:', userId);

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required'
      });
    }

    // Validate webhook
    const validation = await validateDiscordWebhook(webhookUrl);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid webhook URL'
      });
    }

    // Store in database using global supabaseAdmin (bypasses RLS)
    const insertData = {
      user_id: userId,
      platform: 'discord',
      platform_name: serverName || 'Discord',
      oauth_provider: 'webhook',
      access_token: webhookUrl,
      platform_user_id: webhookUrl.substring(0, 50), // Use truncated webhook as ID
      platform_username: serverName || 'Discord Server',
      status: 'active',
      connected_at: new Date().toISOString()
    };

    console.log('📝 Inserting Discord webhook:', JSON.stringify({ ...insertData, access_token: '***' }, null, 2));

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

    console.log('✅ Discord webhook connected for user', userId);
    res.json({
      success: true,
      message: 'Discord connected successfully',
      server: serverName || 'Discord'
    });

  } catch (error) {
    console.error('Error connecting Discord:', error);
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
// TEMPLATE ENDPOINTS (Protected)
// ============================================

/**
 * GET /api/templates
 * Get all templates for the authenticated user
 */
app.get('/api/templates', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, search, sort, order, favorite } = req.query;

    console.log(`📋 GET /api/templates - User: ${userId.substring(0, 8)}... | Category: ${category || 'all'} | Search: ${search || 'none'}`);

    const filters = {
      category,
      search,
      sort,
      order,
      favorite: favorite === 'true'
    };

    const templates = await getTemplates(userId, filters);

    console.log(`   ✅ Returned ${templates.length} templates`);

    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/templates/stats
 * Get template statistics for the user
 */
app.get('/api/templates/stats', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getTemplateStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching template stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/templates/categories
 * Get all template categories with counts
 */
app.get('/api/templates/categories', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await getTemplateCategories(userId);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/templates/:id
 * Get a single template by ID
 */
app.get('/api/templates/:id', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.id);

    const template = await getTemplateById(templateId, userId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates
 * Create a new template
 */
// Re-enabled auth - fixed!
app.post('/api/templates', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateData = req.body;

    console.log('Creating template with data:', { userId, templateData });

    try {
      const template = await createTemplate(userId, templateData);

      console.log('✅ Template created successfully:', { templateId: template.id });

      return res.status(201).json({
        success: true,
        message: 'Template created successfully',
        template
      });
    } catch (dbError) {
      console.error('❌ Database error creating template:', dbError);
      return res.status(400).json({
        success: false,
        error: dbError.message || 'Failed to create template',
        details: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('❌ Server error in /api/templates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * PUT /api/templates/:id
 * Update a template
 */
app.put('/api/templates/:id', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.id);
    const updates = req.body;

    const template = await updateTemplate(templateId, userId, updates);

    res.json({
      success: true,
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
app.delete('/api/templates/:id', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.id);

    await deleteTemplate(templateId, userId);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/:id/use
 * Increment template use count
 */
app.post('/api/templates/:id/use', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.id);

    const template = await incrementTemplateUse(templateId, userId);

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('❌ Error incrementing template use:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/:id/favorite
 * Toggle template favorite status
 */
app.post('/api/templates/:id/favorite', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.id);

    const template = await toggleTemplateFavorite(templateId, userId);

    res.json({
      success: true,
      message: template.is_favorite ? 'Template favorited' : 'Template unfavorited',
      template
    });
  } catch (error) {
    console.error('❌ Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/:id/duplicate
 * Duplicate a template
 */
app.post('/api/templates/:id/duplicate', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.id);

    const template = await duplicateTemplate(templateId, userId);

    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      template
    });
  } catch (error) {
    console.error('❌ Error duplicating template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/:id/clone
 * Clone a public template to user's account
 */
app.post('/api/templates/:id/clone', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = parseInt(req.params.id);

    const template = await clonePublicTemplate(templateId, userId);

    res.status(201).json({
      success: true,
      message: 'Template cloned successfully! You can now customize it.',
      template
    });
  } catch (error) {
    console.error('❌ Error cloning template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/process
 * Process template variables
 */
app.post('/api/templates/process', verifyAuth, async (req, res) => {
  try {
    const { text, variables } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const processed = processTemplateVariables(text, variables);

    res.json({
      success: true,
      text: processed
    });
  } catch (error) {
    console.error('❌ Error processing template variables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/templates/export
 * Export templates as JSON or CSV
 */
app.get('/api/templates/export', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || 'json'; // json or csv
    const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : null;

    // Get templates (either specific IDs or all user's templates)
    let query = supabase
      .from('post_templates')
      .select('*')
      .eq('user_id', userId);

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { data: templates, error } = await query;

    if (error) throw error;
    if (!templates || templates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No templates found to export'
      });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertTemplatesToCSV(templates);
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename="templates-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      // JSON format (default)
      res.header('Content-Type', 'application/json');
      res.header('Content-Disposition', `attachment; filename="templates-${Date.now()}.json"`);
      res.json({
        success: true,
        count: templates.length,
        exportDate: new Date().toISOString(),
        templates: templates.map(t => ({
          name: t.name,
          description: t.description,
          text: t.text,
          image_url: t.image_url,
          platforms: t.platforms,
          category: t.category,
          tags: t.tags
        }))
      });
    }
  } catch (error) {
    console.error('❌ Error exporting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/import
 * Import templates from JSON file
 */
app.post('/api/templates/import', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { templates } = req.body;

    if (!Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Templates array is required and must not be empty'
      });
    }

    // Validate and import each template
    const imported = [];
    const errors = [];

    for (let i = 0; i < templates.length; i++) {
      try {
        const template = templates[i];

        // Validate required fields
        if (!template.name?.trim()) {
          throw new Error('Template name is required');
        }
        if (!template.text?.trim()) {
          throw new Error('Template text is required');
        }
        if (!template.platforms || !Array.isArray(template.platforms) || template.platforms.length === 0) {
          throw new Error('At least one platform is required');
        }

        // Insert template
        const { data, error } = await supabase
          .from('post_templates')
          .insert([{
            user_id: userId,
            name: template.name.trim(),
            description: template.description?.trim() || '',
            text: template.text.trim(),
            image_url: template.image_url || null,
            platforms: template.platforms,
            category: template.category || 'general',
            tags: template.tags || [],
            use_count: 0,
            is_favorite: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        imported.push({
          name: data.name,
          id: data.id,
          status: 'success'
        });
      } catch (err) {
        errors.push({
          index: i,
          templateName: templates[i].name || `Template ${i + 1}`,
          error: err.message
        });
      }
    }

    res.status(201).json({
      success: imported.length > 0,
      message: `Imported ${imported.length} template(s)`,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: templates.length,
        successful: imported.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('❌ Error importing templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/templates/variables
 * Get available template variables with descriptions
 */
app.get('/api/templates/variables', verifyAuth, async (req, res) => {
  try {
    const variables = getAvailableVariables();

    res.json({
      success: true,
      variables
    });
  } catch (error) {
    console.error('❌ Error fetching variables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to convert templates to CSV
function convertTemplatesToCSV(templates) {
  const headers = ['Name', 'Description', 'Category', 'Platforms', 'Tags', 'Text'];
  const rows = templates.map(t => [
    `"${(t.name || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.platforms || []).join(', ')}"`,
    `"${(t.tags || []).join(', ')}"`,
    `"${(t.text || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

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
 * Create Razorpay subscription
 */
/**
 * POST /api/billing/subscription
 * Create Razorpay subscription
 */
app.post('/api/billing/subscription', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, billingCycle } = req.body;

    // Get plan details
    const planConfig = getAllPlans()[plan];
    if (!planConfig) {
      return res.status(400).json({ success: false, error: 'Invalid plan selected' });
    }

    // Check if plan is free (price is 0)
    if (planConfig.price === 0) {
      // Direct upgrade for free plans
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: plan,
          status: 'active',
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          razorpay_subscription_id: `free_${Date.now()}`
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      return res.json({ success: true, free: true });
    }

    const planId = billingCycle === 'annual'
      ? planConfig.razorpay_annual_plan_id
      : planConfig.razorpay_monthly_plan_id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Razorpay Plan ID not configured. Please contact support.'
      });
    }

    const result = await createSubscription(userId, planId);
    res.json(result);

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/verify
 * Verify Razorpay payment
 */
app.post('/api/billing/verify', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentData, plan } = req.body;

    await verifyPayment(userId, paymentData, plan);
    res.json({ success: true });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/portal
 * Manage subscription
 */
/**
 * POST /api/billing/cancel
 * Cancel subscription
 */
app.post('/api/billing/cancel', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await cancelSubscription(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/preview
 * Preview weekly report data (protected)
 */
app.get('/api/reports/preview', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reportData = await generateWeeklyReport(userId);

    res.json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('Error generating report preview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/send-now
 * Send report email immediately (protected, for testing)
 */
app.post('/api/reports/send-now', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const success = await sendReportToUser(userId);

    if (success) {
      res.json({
        success: true,
        message: 'Weekly report sent successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Email reports not enabled or no email configured'
      });
    }

  } catch (error) {
    console.error('Error sending report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/test-email
 * Send test email (protected)
 */
app.post('/api/reports/test-email', verifyAuth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address required'
      });
    }

    await sendTestEmail(email);

    res.json({
      success: true,
      message: `Test email sent to ${email}`
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email. Check email configuration.'
    });
  }
});

/**
 * POST /api/billing/webhook
 * Handle Razorpay webhook events (unprotected)
 */
app.post('/api/billing/webhook', async (req, res) => {
  try {
    await handleWebhook(req);
    res.json({ status: 'ok' });
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
// MILESTONE TRACKING ROUTES
// ============================================

const { sendMilestoneEmail } = require('./services/email');

/**
 * POST /api/milestones/track
 * Track a milestone for a user
 */
app.post('/api/milestones/track', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { milestone_type, metadata } = req.body;

    if (!milestone_type) {
      return res.status(400).json({
        success: false,
        error: 'milestone_type is required'
      });
    }

    // Call the database function to record milestone
    const { data, error } = await supabase
      .rpc('record_milestone', {
        p_user_id: userId,
        p_milestone_type: milestone_type,
        p_metadata: metadata || null
      });

    if (error) {
      console.error('Error recording milestone:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    const result = data[0];

    // Send milestone email if this is a new milestone
    if (result.success) {
      try {
        const userEmail = req.user.email;
        const userName = req.user.user_metadata?.full_name || 'there';

        await sendMilestoneEmail(userEmail, milestone_type, {
          userName,
          dashboardUrl: process.env.DASHBOARD_URL || 'https://app.socialmediaautomator.com',
          postCount: metadata?.post_count || 0
        });

        // Mark email as sent in the database
        await supabase
          .from('user_milestones')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('milestone_type', milestone_type);
      } catch (emailError) {
        console.error('Error sending milestone email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      milestone: result.milestone_data
    });
  } catch (error) {
    console.error('Error in milestone tracking:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/milestones
 * Get all milestones for the current user
 */
app.get('/api/milestones', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Call the database function to get milestones
    const { data, error } = await supabase
      .rpc('get_user_milestones', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error fetching milestones:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      milestones: data || []
    });
  } catch (error) {
    console.error('Error in fetching milestones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/milestones/progress
 * Get milestone progress for the current user (for checklist)
 */
app.get('/api/milestones/progress', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Default progress object
    const defaultProgress = {
      email_verified: 0,
      first_account_connected: 0,
      first_post_created: 0,
      post_milestones: 0,
      onboarding_completed: 0,
      email_verified_at: null,
      first_account_at: null,
      first_post_at: null,
      onboarding_completed_at: null,
      onboarding_progress_percent: 0
    };

    // Try to fetch milestone progress from view
    try {
      const { data, error } = await supabase
        .from('user_milestone_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is OK
        // Other errors (like table doesn't exist) - just return defaults silently
        return res.json({
          success: true,
          progress: defaultProgress
        });
      }

      // If we have data, use it; otherwise use defaults
      const progress = data || defaultProgress;

      res.json({
        success: true,
        progress
      });
    } catch (viewError) {
      // View might not exist yet (migration not applied)
      console.warn('Milestone view not available yet:', viewError.message);
      res.json({
        success: true,
        progress: defaultProgress
      });
    }
  } catch (error) {
    console.error('Error in fetching milestone progress:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/milestones/welcome-email
 * Send welcome email to a new user (triggered after signup)
 */
app.post('/api/milestones/welcome-email', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.user_metadata?.full_name || 'there';

    // Send welcome email
    const { sendWelcomeEmail } = require('./services/email');
    await sendWelcomeEmail(userEmail, {
      userName,
      dashboardUrl: process.env.DASHBOARD_URL || 'https://app.socialmediaautomator.com',
      tutorialUrl: `${process.env.DASHBOARD_URL || 'https://app.socialmediaautomator.com'}?tutorial=true`
    });

    res.json({
      success: true,
      message: 'Welcome email sent'
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================

// ============================================
// YOUTUBE OAUTH ROUTES

// ============================================================================
// TIKTOK OAUTH & POSTING
// ============================================================================

const tiktokService = require('./services/tiktok');

/**
 * POST /api/auth/tiktok/url
 * Generate TikTok OAuth authorization URL
 */
app.post('/api/auth/tiktok/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const redirectUri = `${process.env.APP_URL}/auth/tiktok/callback`;

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in database for verification
    await storeOAuthState(userId, 'tiktok', state);

    const authUrl = tiktokService.generateAuthUrl(redirectUri, state);

    console.log('🎵 TikTok OAuth URL generated');

    res.json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    console.error('❌ Error generating TikTok OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /auth/tiktok/callback
 * Handle TikTok OAuth callback
 */
app.get('/auth/tiktok/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('❌ TikTok OAuth error:', error, error_description);
      return res.redirect(`/dashboard?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
      return res.redirect('/dashboard?error=Missing authorization code or state');
    }

    // Verify state and get user ID
    const stateData = await verifyOAuthState(state, 'tiktok');
    if (!stateData) {
      return res.redirect('/dashboard?error=Invalid state parameter');
    }

    const userId = stateData.user_id;
    const redirectUri = `${process.env.APP_URL}/auth/tiktok/callback`;

    // Exchange code for tokens
    const tokenData = await tiktokService.exchangeCodeForToken(code, redirectUri);

    // Get user info
    const userInfo = await tiktokService.getUserInfo(tokenData.accessToken);

    // Store credentials in database
    await saveUserCredentials(userId, 'tiktok', {
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expires_at: new Date(Date.now() + tokenData.expiresIn * 1000),
      refresh_expires_at: new Date(Date.now() + tokenData.refreshExpiresIn * 1000),
      open_id: tokenData.openId,
      account_id: userInfo.openId,
      username: userInfo.username,
      display_name: userInfo.displayName,
      profile_image_url: userInfo.avatarUrl,
      metadata: {
        follower_count: userInfo.followerCount,
        following_count: userInfo.followingCount,
        is_verified: userInfo.isVerified,
        scope: tokenData.scope
      }
    });

    console.log(`✅ TikTok account connected for user ${userId}: @${userInfo.username}`);

    res.redirect('/connect-accounts?connected=tiktok&success=true');
  } catch (error) {
    console.error('❌ TikTok OAuth callback error:', error);
    res.redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * POST /api/tiktok/check-status
 * Check the status of a TikTok video upload
 */
app.post('/api/tiktok/check-status', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { publishId, accountId } = req.body;

    if (!publishId) {
      return res.status(400).json({
        success: false,
        error: 'Publish ID is required'
      });
    }

    // Get TikTok credentials
    const credentials = await getUserCredentials(userId, 'tiktok', accountId);
    if (!credentials || credentials.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'TikTok account not connected'
      });
    }

    const cred = credentials[0];
    let accessToken = cred.access_token;

    // Refresh token if needed
    if (new Date(cred.expires_at) <= new Date()) {
      const newTokens = await tiktokService.refreshAccessToken(cred.refresh_token);
      accessToken = newTokens.accessToken;
    }

    // Check status
    const status = await tiktokService.checkPublishStatus(accessToken, publishId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('❌ Error checking TikTok status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Internal function for posting to TikTok (used by scheduler)
 */
async function postToTikTok(credentials, postData) {
  try {
    const { access_token, refresh_token, expires_at } = credentials;

    // Check if token needs refresh
    let accessToken = access_token;
    if (new Date(expires_at) <= new Date()) {
      console.log('🔄 TikTok access token expired, refreshing...');
      const newTokens = await tiktokService.refreshAccessToken(refresh_token);
      accessToken = newTokens.accessToken;

      // Update credentials in database
      await updateCredentials(credentials.id, {
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken,
        expires_at: new Date(Date.now() + newTokens.expiresIn * 1000),
        refresh_expires_at: new Date(Date.now() + newTokens.refreshExpiresIn * 1000)
      });
    }

    // Validate video URL if provided
    if (postData.videoUrl) {
      const isValid = await tiktokService.validateVideoUrl(postData.videoUrl);
      if (!isValid) {
        throw new Error('Video URL is not accessible or not a valid video file');
      }
    } else {
      throw new Error('TikTok requires a video URL. Text-only posts are not supported.');
    }

    // Post to TikTok
    const result = await tiktokService.postVideo(accessToken, {
      videoUrl: postData.videoUrl,
      caption: postData.text || '',
      privacyLevel: postData.privacy || 'PUBLIC_TO_EVERYONE',
      disableComment: postData.disableComment || false,
      disableDuet: postData.disableDuet || false,
      disableStitch: postData.disableStitch || false
    });

    return {
      success: true,
      platform: 'tiktok',
      accountId: credentials.account_id,
      publishId: result.publishId,
      status: result.status,
      message: result.message
    };
  } catch (error) {
    console.error(`❌ Failed to post to TikTok account ${credentials.account_id}:`, error.message);
    return {
      success: false,
      platform: 'tiktok',
      accountId: credentials.account_id,
      error: error.message
    };
  }
}

// ============================================

app.post('/api/auth/youtube/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const state = encryptState(userId);
    const oauthUrl = generateYouTubeOAuthUrl(userId, state);
    console.log('🎬 YouTube OAuth URL generated');
    res.json({ success: true, oauthUrl });
  } catch (error) {
    console.error('Error generating YouTube OAuth URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/auth/youtube/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    console.log('🎬 YouTube callback received');

    if (error) {
      console.error('YouTube OAuth error:', error);
      return res.redirect(`/dashboard?error=youtube_denied`);
    }
    if (!code || !state) {
      return res.redirect('/dashboard?error=youtube_missing_params');
    }

    let userId;
    try {
      userId = decryptState(state);
    } catch (stateError) {
      return res.redirect('/dashboard?error=youtube_invalid_state');
    }

    const tokenData = await exchangeYouTubeCode(code);
    const channelInfo = await getChannelInfo(tokenData.accessToken);
    console.log('📺 Channel info result:', channelInfo);

    if (!channelInfo) {
      throw new Error('Could not retrieve channel information');
    }

    // Use global supabaseAdmin instead of creating new client

    const expiresAt = new Date(Date.now() + (tokenData.expiresIn * 1000));

    const { error: upsertError } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'youtube',
        platform_name: 'YouTube',
        oauth_provider: 'google',
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: expiresAt.toISOString(),
        platform_user_id: channelInfo.channelId,
        platform_username: channelInfo.title,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      });

    if (upsertError) throw upsertError;

    console.log(`✅ YouTube account connected for user ${userId}`);
    res.redirect('/connect-accounts?connected=youtube&success=true');

  } catch (error) {
    console.error('Error in YouTube callback:', error.message);
    res.redirect('/dashboard?error=youtube_failed');
  }
});

// ============================================
// PINTEREST OAUTH & API ROUTES
// ============================================

app.post('/api/auth/pinterest/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/pinterest/callback`;
    const authUrl = initiatePinterestOAuth(userId, redirectUri);
    console.log('📍 Pinterest OAuth URL generated for user:', userId);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating Pinterest auth URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/auth/pinterest/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    console.log('📍 Pinterest callback received');

    if (error) {
      console.error('Pinterest OAuth error:', error);
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=pinterest_denied`);
    }

    if (!code || !state) {
      console.error('Pinterest callback missing params');
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=pinterest_missing_params`);
    }

    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/pinterest/callback`;
    await handlePinterestCallback(code, state, redirectUri);

    console.log('✅ Pinterest account connected successfully');
    res.redirect(`${getFrontendUrl()}/connect-accounts?success=pinterest_connected`);
  } catch (error) {
    console.error('Pinterest callback error:', error);
    res.redirect(`${getFrontendUrl()}/connect-accounts?error=pinterest_failed`);
  }
});

// Get user's Pinterest boards
app.get('/api/pinterest/boards', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get Pinterest credentials
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'pinterest')
      .single();

    if (error || !account) {
      return res.status(404).json({ success: false, error: 'Pinterest account not connected' });
    }

    const result = await getUserBoards({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      token_expires_at: account.token_expires_at,
      user_id: userId
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching Pinterest boards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// TUMBLR OAUTH ROUTES (OAuth 1.0a)
// ============================================

// Get Tumblr OAuth URL (Step 1)
app.post('/api/auth/tumblr/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!process.env.TUMBLR_CONSUMER_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Tumblr integration not configured. Please add TUMBLR_CONSUMER_KEY to environment variables.'
      });
    }

    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/tumblr/callback`;
    const { authUrl } = await initiateTumblrOAuth(userId, redirectUri);

    console.log('📘 Tumblr OAuth URL generated for user:', userId);

    res.json({
      success: true,
      url: authUrl
    });

  } catch (error) {
    console.error('Error generating Tumblr OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Tumblr OAuth URL'
    });
  }
});

// Tumblr OAuth callback (Step 3)
app.get('/auth/tumblr/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier, denied } = req.query;

    console.log('📘 Tumblr callback received');

    // Handle user denial
    if (denied) {
      console.error('Tumblr OAuth denied by user');
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=tumblr_denied`);
    }

    if (!oauth_token || !oauth_verifier) {
      console.error('Tumblr callback missing parameters');
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=tumblr_missing_params`);
    }

    // Complete OAuth flow
    const result = await handleTumblrCallback(oauth_token, oauth_verifier);

    console.log('✅ Tumblr account connected successfully:', result.blogName);

    // Redirect to settings with success message
    res.redirect(`${getFrontendUrl()}/connect-accounts?success=tumblr_connected&blog=${encodeURIComponent(result.blogName)}`);

  } catch (error) {
    console.error('❌ Tumblr callback error:', error);
    res.redirect(`${getFrontendUrl()}/connect-accounts?error=tumblr_failed`);
  }
});

// ============================================
// MASTODON API ROUTES
// ============================================

// Connect Mastodon account with access token
app.post('/api/auth/mastodon/connect', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accessToken, instanceUrl } = req.body;

    if (!accessToken || !instanceUrl) {
      return res.status(400).json({
        success: false,
        error: 'Access token and instance URL are required'
      });
    }

    // Normalize instance URL
    let normalizedUrl = instanceUrl.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    console.log(`🐘 Validating Mastodon credentials for ${normalizedUrl}...`);

    // Verify credentials and get user info
    const userInfo = await verifyMastodonCredentials(accessToken, normalizedUrl);

    if (!userInfo.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Mastodon credentials'
      });
    }

    // Save to database
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'mastodon',
        platform_name: 'Mastodon',
        oauth_provider: 'access_token',
        access_token: accessToken,
        platform_user_id: userInfo.id,
        platform_username: userInfo.acct, // Full handle with instance
        platform_metadata: JSON.stringify({
          instanceUrl: normalizedUrl,
          username: userInfo.username,
          displayName: userInfo.displayName,
          url: userInfo.url,
          followersCount: userInfo.followersCount
        }),
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Mastodon credentials:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save Mastodon connection'
      });
    }

    console.log(`✅ Mastodon connected for user ${userId}: @${userInfo.acct}`);

    res.json({
      success: true,
      account: {
        id: account.id,
        platform: 'mastodon',
        username: userInfo.acct,
        displayName: userInfo.displayName
      }
    });

  } catch (error) {
    console.error('❌ Error connecting Mastodon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect Mastodon account'
    });
  }
});

// ============================================
// BLUESKY API ROUTES
// ============================================

// Connect Bluesky account with handle + app password
app.post('/api/auth/bluesky/connect', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { handle, appPassword } = req.body;

    if (!handle || !appPassword) {
      return res.status(400).json({
        success: false,
        error: 'Handle and app password are required'
      });
    }

    console.log(`🦋 Validating Bluesky credentials for @${handle}...`);

    // Verify credentials and get user info (creates session + gets profile)
    const userInfo = await verifyBlueskyCredentials(handle, appPassword);

    if (!userInfo.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Bluesky credentials'
      });
    }

    // Save to database
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'bluesky',
        platform_name: 'Bluesky',
        oauth_provider: 'app_password',
        access_token: userInfo.accessJwt,
        refresh_token: userInfo.refreshJwt,
        platform_user_id: userInfo.did,
        platform_username: userInfo.handle,
        platform_metadata: JSON.stringify({
          did: userInfo.did,
          handle: userInfo.handle,
          displayName: userInfo.displayName,
          followersCount: userInfo.followersCount,
          followsCount: userInfo.followsCount,
          postsCount: userInfo.postsCount
        }),
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Bluesky credentials:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save Bluesky connection'
      });
    }

    console.log(`✅ Bluesky connected for user ${userId}: @${userInfo.handle}`);

    res.json({
      success: true,
      account: {
        id: account.id,
        platform: 'bluesky',
        handle: userInfo.handle,
        displayName: userInfo.displayName
      }
    });

  } catch (error) {
    console.error('❌ Error connecting Bluesky:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect Bluesky account'
    });
  }
});

// ============================================
// DEV.TO API ROUTES
// ============================================

// Connect Dev.to account with API key
app.post('/api/auth/devto/connect', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    console.log(`📝 Validating Dev.to API key for user ${userId}...`);

    // Validate API key and get user info
    const validation = await validateDevToApiKey(apiKey);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid Dev.to API key'
      });
    }

    const userInfo = validation.user;

    // Save to database
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'devto',
        platform_name: 'Dev.to',
        oauth_provider: 'api_key',
        access_token: apiKey, // Store API key as access_token
        platform_user_id: userInfo.userId.toString(),
        platform_username: userInfo.username,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Dev.to credentials:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save Dev.to connection'
      });
    }

    console.log(`✅ Dev.to connected successfully for user ${userId}: @${userInfo.username}`);

    res.json({
      success: true,
      account: {
        id: account.id,
        platform: 'devto',
        username: userInfo.username,
        name: userInfo.name
      }
    });

  } catch (error) {
    console.error('❌ Error connecting Dev.to:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect Dev.to account'
    });
  }
});

// ============================================
// MEDIUM OAUTH & API ROUTES
// ============================================

// Get Medium OAuth URL
app.post('/api/auth/medium/url', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!process.env.MEDIUM_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        error: 'Medium integration not configured. Please add MEDIUM_CLIENT_ID to environment variables.'
      });
    }

    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/medium/callback`;
    const authUrl = initiateMediumOAuth(userId, redirectUri);

    console.log('📝 Medium OAuth URL generated for user:', userId);

    res.json({
      success: true,
      url: authUrl
    });

  } catch (error) {
    console.error('Error generating Medium OAuth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Medium OAuth URL'
    });
  }
});

// Medium OAuth callback
app.get('/auth/medium/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    console.log('📝 Medium callback received');

    // Handle OAuth error
    if (error) {
      console.error('Medium OAuth error:', error);
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=medium_denied`);
    }

    if (!code || !state) {
      console.error('Medium callback missing parameters');
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=medium_missing_params`);
    }

    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/medium/callback`;

    // Handle the callback
    const result = await handleMediumCallback(code, state, redirectUri);

    console.log('✅ Medium account connected successfully:', result.username);

    // Redirect to settings with success message
    res.redirect(`${getFrontendUrl()}/connect-accounts?success=medium_connected&username=${encodeURIComponent(result.username)}`);

  } catch (error) {
    console.error('❌ Medium callback error:', error);
    res.redirect(`${getFrontendUrl()}/connect-accounts?error=medium_failed`);
  }
});

// ============================================

// CATCH-ALL ROUTE FOR REACT SPA (must be last)
// ============================================

// Serve React Dashboard for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes, auth routes, template CSV, assets, and vite.svg (already served above)
  if (req.path.startsWith('/api/') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/template.csv') ||
    req.path.startsWith('/assets/') ||
    req.path === '/vite.svg') {
    console.log('⏭️  Skipping catch-all for:', req.path);
    return next();
  }

  // Explicitly serve landing page for public policy routes
  const publicRoutes = [
    '/privacy',
    '/terms',
    '/refund-policy',
    '/shipping-policy',
    '/contact',
    '/data-deletion'
  ];

  if (publicRoutes.includes(req.path)) {
    console.log('📄 Serving public policy page:', req.path);
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  const dashboardIndex = path.join(__dirname, 'dashboard/dist/index.html');
  const fs = require('fs');

  if (fsSync.existsSync(dashboardIndex)) {
    console.log('🎯 Catch-all: Serving dashboard for path:', req.path);
    res.sendFile(dashboardIndex);
  } else {
    // Fallback to landing page
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// ============================================
// START SERVER
// ============================================
// Deployment timestamp: 2025-01-27 - Instagram/Facebook scheduler fix

// Error handling middleware (must be last)
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
app.use(notFoundHandler); // 404 handler for undefined routes
app.use(errorHandler); // Global error handler

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
  console.log(`   POST /api/ai/youtube-caption - Generate captions from URL (YouTube or web page)`);
  console.log(`   GET  /api/ai/image/styles - Get AI image styles`);
  console.log(`   GET  /api/ai/image/platforms - Get platform options`);
  console.log(`   GET  /api/ai/image/examples - Get example prompts`);
  console.log(`   POST /api/ai/image/generate - Generate AI images`);
  console.log('\n' + '='.repeat(50) + '\n');
});
// Force redeploy - Fix dynamic project ID in auth
