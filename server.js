require('dotenv').config(); // force restart
const { validateEnv } = require('./utilities/env-validator');

// Validate environment variables before starting
validateEnv();

const express = require('express');
const cors = require('cors');
const path = require('path');
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

const { generateCaption, generateHashtags, recommendPostTime, generatePostVariations, generateContentIdeas, improveCaption, generateCaptionFromImage } = require('./services/ai');
const { analyzeBestTimes, getPostingHeatmap } = require('./services/analytics');
const { generateWeeklyReport, sendReportToUser, sendWeeklyReportsToAll } = require('./services/reports');
const {
  sendTestEmail,
  sendEmail
} = require('./services/email');
const { getUserWorkspace, requireRole, getTeamMembers } = require('./services/permissions');
const { logActivity, getActivityFeed, formatActivity } = require('./services/activity');
const { searchVideos, getVideoById, getPopularVideos, validatePexelsKey } = require('./services/video-search');
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
} = require('./services/accounts');
const {
  getBusinessProfile,
  upsertBusinessProfile,
  deleteBusinessProfile,
  hasBusinessProfile,
  extractBusinessDataFromWebsite
} = require('./services/business');
const {
  uploadImage,
  uploadVideo
} = require('./services/cloudinary');
const {
  initiateLinkedInOAuth,
  handleLinkedInCallback,
  refreshLinkedInToken,
  initiateTwitterOAuth,
  handleTwitterCallback,
  disconnectAccount,
  disconnectAccountById,
  getUserConnectedAccounts,
  getUserCredentialsForPosting
} = require('./services/oauth');
const {
  createCheckoutSession,
  createPortalSession,
  createSubscription,
  verifyPayment,
  handleWebhook,
  checkUsage,
  incrementUsage,
  getUserBillingInfo
} = require('./services/billing');
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
const { analyzeBrandVoice, getBrandVoiceProfile, bootstrapBrandVoice, getSamplePosts, saveSamplePosts } = require('./services/brand-voice-analyzer');
const brandVoiceBootstrapRoutes = require('./routes/brand-voice-bootstrap');
const { getTrendAlerts, monitorTrendsForUser, fetchAllTrends, fetchKeywordTrendingData } = require('./services/trend-monitor');
const { fetchTrendingNews, getNewsByCategory, searchNews, fetchNewsByCategory } = require('./services/news-agent');
const {
  analyzeUserPatterns,
  generateInsights,
  scoreDraftPost,
  getUserInsights,
  getUserPatterns
} = require('./services/analytics-insights-agent');

const { getAllUsers, isAdmin } = require('./services/admin');


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
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'x-client-info': 'social-media-automator'
        }
      }
    }
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

// Circuit breaker for auth failures
let authFailureCount = 0;
let lastAuthFailureTime = 0;
const AUTH_FAILURE_THRESHOLD = 5;
const AUTH_FAILURE_WINDOW = 60000; // 1 minute
let circuitBreakerOpen = false;
let circuitBreakerOpenUntil = 0;

// Auth middleware
async function verifyAuth(req, res, next) {
  // Skip auth check if Supabase not configured (development mode)
  if (!supabase) {
    req.user = { id: 'dev-user', email: 'dev@example.com' };
    return next();
  }

  // Check circuit breaker
  const now = Date.now();
  if (circuitBreakerOpen && now < circuitBreakerOpenUntil) {
    console.warn('⚠️  Circuit breaker open - auth service unavailable');
    return res.status(503).json({
      success: false,
      error: 'Authentication service temporarily unavailable',
      retryAfter: Math.ceil((circuitBreakerOpenUntil - now) / 1000),
      isNetworkError: true
    });
  }

  // Reset circuit breaker if window expired
  if (now - lastAuthFailureTime > AUTH_FAILURE_WINDOW) {
    authFailureCount = 0;
    circuitBreakerOpen = false;
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

    // Verify token with Supabase with timeout handling
    let user, error;
    try {
      const result = await Promise.race([
        supabase.auth.getUser(token),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 8000)
        )
      ]);
      user = result.data?.user;
      error = result.error;

      // Reset failure count on success
      authFailureCount = 0;
      circuitBreakerOpen = false;
    } catch (timeoutError) {
      // Network timeout or connection error
      if (timeoutError.message === 'AUTH_TIMEOUT' ||
        timeoutError.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        timeoutError.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error('⚠️  Supabase connection timeout - returning 503');

        // Track failures for circuit breaker
        authFailureCount++;
        lastAuthFailureTime = now;

        if (authFailureCount >= AUTH_FAILURE_THRESHOLD) {
          circuitBreakerOpen = true;
          circuitBreakerOpenUntil = now + 30000; // Open for 30 seconds
          console.error(`🔴 Circuit breaker opened after ${authFailureCount} failures`);
        }

        return res.status(503).json({
          success: false,
          error: 'Authentication service temporarily unavailable',
          retryAfter: circuitBreakerOpen ? 30 : 5,
          isNetworkError: true
        });
      }
      throw timeoutError;
    }

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
    // Check if it's a network/connection error
    if (error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ENOTFOUND')) {
      console.error('⚠️  Network error during auth verification:', error.message);

      // Track failures for circuit breaker
      authFailureCount++;
      lastAuthFailureTime = now;

      if (authFailureCount >= AUTH_FAILURE_THRESHOLD) {
        circuitBreakerOpen = true;
        circuitBreakerOpenUntil = now + 30000; // Open for 30 seconds
        console.error(`🔴 Circuit breaker opened after ${authFailureCount} failures`);
      }

      return res.status(503).json({
        success: false,
        error: 'Authentication service temporarily unavailable',
        retryAfter: circuitBreakerOpen ? 30 : 5,
        isNetworkError: true
      });
    }

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

// Body Parsers - REQUIRED for req.body to work
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const helmet = require('helmet');

app.use(cors());

// Security headers with Helmet
app.use(helmet({
  // Chrome enforces COOP strictly; 'same-origin-allow-popups' is required
  // for redirect-based OAuth (window.location.href) to work in Chrome.
  // Default 'same-origin' breaks Twitter/LinkedIn OAuth callbacks in Chrome.
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "*"], // Allow all external images for news feed
      connectSrc: ["'self'", "https://*.supabase.co", "https://gzchblilbthkfuxqhoyo.supabase.co", "https://api.razorpay.com", "https://lumberjack-cx.razorpay.com", "https://*.bing.net", "https://api.twitter.com", "https://twitter.com", "https://x.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
      upgradeInsecureRequests: [],
    },
  }
}));

// Request logging middleware
const requestLogger = require('./middleware/request-logger');
app.use(requestLogger);

// Get all users (Admin only) - MOVED TO TOP TO FIX 404
app.get('/api/admin/users', verifyAuth, async (req, res) => {
  try {
    const userEmail = req.user.email;

    if (!isAdmin(userEmail)) {
      console.warn(`⚠️ Unauthorized admin access attempt by: ${userEmail}`);
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const users = await getAllUsers();
    res.json(users);

  } catch (error) {
    console.error('❌ Admin API Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

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

const supportedCreatorPlatforms = new Set(['linkedin', 'twitter']);
function getPrimaryPostingError(platformResults) {
  const flattenResults = Object.values(platformResults || {})
    .flat()
    .filter(result => result && typeof result === 'object');
  const failedResult = flattenResults.find(result => result.error);

  if (!failedResult?.error) return 'Failed to post';

  if (/credits? to fulfill this request|creditsdepleted|out of ppu credits/i.test(failedResult.error)) {
    return 'X API credits are depleted for this developer account. Add or purchase API credits in the X Developer Portal, then try posting again.';
  }

  return failedResult.error;
}

const removedFeaturePrefixes = [
  '/api/ab-tests',
  '/api/bulk',
  '/api/carousel',
  '/api/content-recycling',
  '/api/team',
  '/api/webhooks',
  '/api/reddit',
  '/api/pinterest',
  '/api/tiktok',
  '/api/posts/pending-approvals',
  '/api/posts/submit-for-review',
  '/api/auth/reddit',
  '/api/auth/telegram',
  '/api/auth/slack',
  '/api/auth/discord',
  '/api/auth/tiktok',
  '/api/auth/youtube',
  '/api/auth/pinterest',
  '/api/auth/tumblr',
  '/api/auth/mastodon',
  '/api/auth/bluesky',
  '/api/auth/devto',
  '/api/auth/medium',
  '/auth/reddit',
  '/auth/tiktok',
  '/auth/youtube',
  '/auth/pinterest',
  '/auth/tumblr',
  '/auth/medium'
];

app.use((req, res, next) => {
  const isRemovedFeature = removedFeaturePrefixes.some(prefix => req.path.startsWith(prefix));
  const isApprovalAction = /^\/api\/posts\/[^/]+\/(approve|reject|request-changes)$/.test(req.path);

  if (!isRemovedFeature && !isApprovalAction) return next();

  return res.status(410).json({
    success: false,
    error: 'This feature has been removed while Social Media Automator focuses on LinkedIn and X.'
  });
});

app.use(['/api/post/now', '/api/post/schedule'], (req, res, next) => {
  const platforms = Array.isArray(req.body?.platforms) ? req.body.platforms : [];
  const unsupported = platforms.filter(platform => !supportedCreatorPlatforms.has(platform));

  if (unsupported.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Unsupported platform(s): ${unsupported.join(', ')}. Only LinkedIn and X are supported.`
    });
  }

  return next();
});


// Redirect /auth.html to /auth to ensure env vars are injected (MUST be before static files)
app.get('/auth.html', (req, res) => {
  res.redirect('/auth');
});

// IMPORTANT: Serve dashboard static files FIRST in production (with correct MIME types)
if (process.env.NODE_ENV === 'production') {
  const dashboardPath = path.join(__dirname, 'dashboard/dist');
  const fs = require('fs');

  if (fsSync.existsSync(dashboardPath)) {
    // Verify critical build files exist
    const assetsPath = path.join(dashboardPath, 'assets');
    if (fsSync.existsSync(assetsPath)) {
      const assets = fsSync.readdirSync(assetsPath);
      const analyticsFile = assets.find(f => f.startsWith('Analytics-') && f.endsWith('.js'));
      if (!analyticsFile) {
        console.warn('⚠️  WARNING: Analytics.js chunk not found in build! Dashboard may need rebuilding.');
      } else {
        console.log(`✅ Analytics chunk found: ${analyticsFile}`);
      }
    }

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
  } else {
    console.error('❌ ERROR: dashboard/dist folder not found! Run: npm run build');
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

// Start the queue processor unless explicitly disabled for local debugging.
const schedulerDisabled = process.env.DISABLE_SCHEDULER === 'true';
if (schedulerDisabled) {
  console.log('⏸️  Queue processor disabled via DISABLE_SCHEDULER=true');
} else {
  startScheduler();
}

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

    // Check if file exists
    try {
      await fs.access(authPath);
    } catch (accessErr) {
      console.error('❌ Auth.html file not found at:', authPath);
      console.error('Current directory:', __dirname);
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>❌ Configuration Error</h1>
            <p>Auth page file not found. Please check server configuration.</p>
            <p style="color: #666; font-size: 12px;">Path: ${authPath}</p>
          </body>
        </html>
      `);
    }

    let content = await fs.readFile(authPath, 'utf8');

    // Inject environment variables safely with multiple regex patterns
    if (process.env.SUPABASE_URL) {
      // Try multiple patterns to match different quote styles
      const patterns = [
        /const SUPABASE_URL = ['"].*?['"];/,
        /const SUPABASE_URL = '.*';/,
        /const SUPABASE_URL = ".*";/
      ];

      let replaced = false;
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            `const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL)};`
          );
          replaced = true;
          console.log('✅ Injected SUPABASE_URL from environment');
          break;
        }
      }

      if (!replaced) {
        console.warn('⚠️  Could not find SUPABASE_URL pattern to replace');
      }
    } else {
      console.warn('⚠️  SUPABASE_URL environment variable not set');
    }

    if (process.env.SUPABASE_ANON_KEY) {
      // Try multiple patterns to match different quote styles
      const patterns = [
        /const SUPABASE_ANON_KEY = ['"].*?['"];/,
        /const SUPABASE_ANON_KEY = '.*';/,
        /const SUPABASE_ANON_KEY = ".*";/
      ];

      let replaced = false;
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            `const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_ANON_KEY)};`
          );
          replaced = true;
          console.log('✅ Injected SUPABASE_ANON_KEY from environment');
          break;
        }
      }

      if (!replaced) {
        console.warn('⚠️  Could not find SUPABASE_ANON_KEY pattern to replace');
      }
    } else {
      console.warn('⚠️  SUPABASE_ANON_KEY environment variable not set');
    }

    // Set proper content type
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(content);
  } catch (err) {
    console.error('❌ Error serving auth page:', err);
    console.error('Stack:', err.stack);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>❌ Server Error</h1>
          <p>Error loading authentication page. Please try again later.</p>
          <p style="color: #666; font-size: 12px;">${err.message}</p>
        </body>
      </html>
    `);
  }
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
 * GET /api/trends
 * Fetch trending topics/posts from aggregated sources
 */
app.get('/api/trends', verifyAuth, async (req, res) => {
  try {
    const trends = await fetchAllTrends();
    res.json({
      success: true,
      trends: trends || []
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/news/refresh
 * Force refresh AI news (clear cache and fetch fresh)
 */
app.post('/api/news/refresh', verifyAuth, async (req, res) => {
  try {
    const { clearNewsCache, fetchTrendingNews } = require('./services/news-agent');

    console.log('🔄 Force refreshing AI news for user:', req.user.id);
    clearNewsCache(); // Clear cache to ensure fresh data

    // Fetch fresh news articles with randomization for different articles each time
    const news = await fetchTrendingNews(20, true); // true = randomize selection

    console.log(`✅ Refreshed ${news.length} news articles (randomized selection)`);

    // Return fresh data with timestamp to prevent caching
    res.json({
      success: true,
      news: news || [],
      message: 'News feed refreshed',
      timestamp: new Date().toISOString(),
      count: news.length
    });
  } catch (error) {
    console.error('Error refreshing news:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
 * GET /api/auth/verify
 * Verify user token and return user info (protected)
 */
app.get('/api/auth/verify', verifyAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
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
    }

    const finalImageUrl = imageUrl;

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
      error: allSuccess ? null : getPrimaryPostingError(platformResults),
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
    const postId = req.params.id; // Don't parseInt - support UUIDs

    console.log(`🗑️  DELETE /api/queue/${postId} - User: ${userId}`);

    const result = await deleteFromQueue(postId, userId);

    console.log(`🗑️  Delete result:`, JSON.stringify(result, null, 2));

    if (result.success && result.count > 0) {
      console.log(`✅ Successfully deleted post ${postId}`);
      res.json({
        success: true,
        message: 'Post removed from queue',
        count: result.count
      });
    } else if (result.success && result.count === 0) {
      console.log(`⚠️  Post ${postId} not found or not owned by user ${userId}`);
      res.status(404).json({
        success: false,
        error: 'Post not found or you do not have permission to delete it'
      });
    } else {
      console.error(`❌ Delete failed:`, result.error);
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to delete post'
      });
    }
  } catch (error) {
    console.error('❌ Error in /api/queue/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function parsePostResults(results) {
  if (!results) return {};
  if (typeof results === 'string') {
    try {
      return JSON.parse(results);
    } catch (error) {
      return {};
    }
  }
  return results;
}

function resultEntries(platformResults) {
  if (!platformResults) return [];
  return Array.isArray(platformResults) ? platformResults : [platformResults];
}

function parsePlatformList(platforms) {
  if (Array.isArray(platforms)) return platforms;
  if (!platforms) return [];
  if (typeof platforms === 'string') {
    try {
      const parsed = JSON.parse(platforms);
      return Array.isArray(parsed) ? parsed : [platforms];
    } catch (error) {
      return [platforms];
    }
  }
  return [];
}

function getFailedPlatforms(results, platforms = []) {
  const parsedResults = parsePostResults(results);
  const knownPlatforms = new Set([
    ...Object.keys(parsedResults),
    ...parsePlatformList(platforms)
  ]);

  return Array.from(knownPlatforms).filter((platform) => {
    const entries = resultEntries(parsedResults[platform]);
    if (entries.length === 0) return true;
    return entries.some((entry) => entry && (entry.success === false || entry.error));
  });
}

function calculatePostStatus(results) {
  const entries = Object.values(parsePostResults(results)).flatMap(resultEntries);
  const meaningfulEntries = entries.filter((entry) => entry && typeof entry === 'object');

  if (meaningfulEntries.length === 0) return 'failed';

  const successCount = meaningfulEntries.filter((entry) => entry.success === true).length;
  const failureCount = meaningfulEntries.filter((entry) => entry.success === false || entry.error).length;

  if (successCount > 0 && failureCount === 0) return 'posted';
  if (successCount > 0 && failureCount > 0) return 'partial';
  return 'failed';
}

/**
 * POST /api/posts/:id/retry
 * Manually retry failed platforms for a failed or partial historical post.
 */
app.post('/api/posts/:id/retry', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (error || !post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found or you do not have permission to retry it'
      });
    }

    if (!['failed', 'partial'].includes(post.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only failed or partial posts can be retried'
      });
    }

    const originalResults = parsePostResults(post.results);
    const failedPlatforms = getFailedPlatforms(originalResults, post.platforms);
    const retryablePlatforms = failedPlatforms.filter((platform) => ['linkedin', 'twitter'].includes(platform));

    if (retryablePlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No retryable failed platforms found for this post',
        failedPlatforms
      });
    }

    console.log(`🔁 Manual retry requested for post ${postId} by user ${userId}: ${retryablePlatforms.join(', ')}`);

    const retryResults = await postNow({
      user_id: userId,
      text: post.text,
      image_url: post.image_url,
      platforms: retryablePlatforms
    });

    const mergedResults = {
      ...originalResults,
      ...retryResults
    };
    const status = calculatePostStatus(mergedResults);
    const updatedPost = await updatePostStatus(post.id, status, mergedResults);

    res.json({
      success: status === 'posted',
      partial: status === 'partial',
      status,
      retriedPlatforms: retryablePlatforms,
      skippedPlatforms: failedPlatforms.filter((platform) => !retryablePlatforms.includes(platform)),
      results: mergedResults,
      post: updatedPost
    });
  } catch (error) {
    console.error('❌ Error in /api/posts/:id/retry:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retry post'
    });
  }
});

/**
 * POST /api/ai-tools/schedule-now
 * Manually trigger scheduling of 10 AI posts (protected)
 */
app.post('/api/ai-tools/schedule-now', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, articles, platforms, scheduleMode, preset, distribution } = req.body;
    console.log(`🤖 Manual AI posts scheduling triggered by user: ${userId}${url ? ` for URL: ${url}` : ''}${articles ? ` for ${articles.length} articles` : ''}${platforms ? ` on ${platforms}` : ''} [Mode: ${scheduleMode || 'default'}]${preset ? ` [Preset: ${preset}]` : ''}`);

    // Import the scheduler function
    const { scheduleAIToolsPosts } = require('./services/ai-tools-scheduler');

    // Run the scheduler for this specific user with schedule mode
    console.log(`📊 Schedule request details:`, {
      userId,
      url: url || 'none',
      articles: articles?.length || 0,
      platforms: platforms || 'default',
      scheduleMode: scheduleMode || 'default',
      preset: preset || 'none',
      distribution: distribution || 'none',
      useBusinessProfile: req.body.useBusinessProfile || false
    });

    // Get business profile if requested
    let businessProfile = null;
    if (req.body.useBusinessProfile) {
      const { getBusinessProfile } = require('./services/business');
      businessProfile = await getBusinessProfile(userId);
      if (businessProfile) {
        console.log(`🏢 Using business profile: ${businessProfile.business_name}`);
      }
    }

    const weekOffset = req.body.weekOffset || 0; // 0 = current week, 1 = next week
    const result = await scheduleAIToolsPosts(userId, url, articles, platforms, scheduleMode || 'default', businessProfile, preset, distribution, weekOffset);

    console.log(`📊 Scheduling result:`, {
      success: result.success,
      scheduled: result.scheduled,
      failed: result.failed,
      total: result.total,
      error: result.error
    });

    res.json({
      success: result.success !== false,
      scheduled: result.scheduled || 0,
      failed: result.failed || 0,
      total: result.total || 0,
      message: result.success !== false
        ? `Successfully scheduled ${result.scheduled || 0} posts (${result.failed || 0} failed)`
        : result.error || 'Failed to schedule posts',
      error: result.error
    });
  } catch (error) {
    console.error('❌ Error in /api/ai-tools/schedule-now:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to schedule AI posts'
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

    // Get all posts that are queued, failed, or partial (scheduled for future)
    // Include failed/partial posts so users can see and retry them
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id, text, platforms, schedule_time, image_url, created_at, status')
      .eq('user_id', userId)
      .in('status', ['queued', 'failed', 'partial']) // Show queued, failed, and partial posts
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
      start: post.schedule_time, // Keep as ISO string for JSON serialization
      end: post.schedule_time,   // Keep as ISO string for JSON serialization
      text: post.text,
      platforms: post.platforms || [],
      image_url: post.image_url,
      status: post.status || 'queued'
    }));

    console.log(`📅 Returning ${scheduledPosts.length} scheduled posts for user ${userId}`);

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

// =============================================================================
// Platform Analytics Routes — real followers/views/likes/comments from platform APIs
// =============================================================================
const { syncUserAnalytics } = require('./services/platformAnalytics');

/**
 * POST /api/platform-analytics/sync
 * Manually trigger a data refresh for the current user
 */
app.post('/api/platform-analytics/sync', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await syncUserAnalytics(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in /api/platform-analytics/sync:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/platform-analytics/snapshots
 * Latest snapshot per platform for the current user
 */
app.get('/api/platform-analytics/snapshots', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('platform_daily_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50);
    if (error) throw error;
    // Return only the latest snapshot per platform
    const latest = {};
    for (const row of data || []) {
      if (!latest[row.platform]) latest[row.platform] = row;
    }
    res.json({ success: true, snapshots: Object.values(latest) });
  } catch (error) {
    console.error('Error in /api/platform-analytics/snapshots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/platform-analytics/history
 * Last 30 days of snapshots per platform (for sparklines)
 */
app.get('/api/platform-analytics/history', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('platform_daily_snapshots')
      .select('platform, date, followers, total_views, total_likes, total_comments')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true });
    if (error) throw error;
    res.json({ success: true, history: data || [] });
  } catch (error) {
    console.error('Error in /api/platform-analytics/history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/platform-analytics/posts
 * Top posts across all platforms for the current user
 */
app.get('/api/platform-analytics/posts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('platform_post_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('published_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ success: true, posts: data || [] });
  } catch (error) {
    console.error('Error in /api/platform-analytics/posts:', error);
    res.status(500).json({ success: false, error: error.message });
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
      platform || 'linkedin',
      contentType,
      videoUrl // Pass original URL as sourceUrl
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
      platform || 'linkedin'
    );

    // Increment AI usage count
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      hashtags,
      count: hashtags.length,
      platform: platform || 'linkedin'
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
 * GET /api/trends/live
 * Get live trending topics from Google and Reddit (no auth required for read-only if public, but keeping verifyAuth for consistency)
 */
app.get('/api/trends/live', verifyAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    console.log(`🔥 Fetching live trends...`);

    const trends = await fetchAllTrends({ limit: parseInt(limit) });

    res.json({
      success: true,
      trends,
      count: trends.length
    });

  } catch (error) {
    console.error('❌ Error in /api/trends/live:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch live trends'
    });
  }
});

/**
 * GET /api/news/public
 * Public endpoint for landing page - fetch trending AI news (no auth required)
 */
app.get('/api/news/public', async (req, res) => {
  try {
    const { limit = 12 } = req.query; // Default 12 for landing page
    const { fetchTrendingNews } = require('./services/news-agent');
    const news = await fetchTrendingNews(parseInt(limit), true); // Randomize for variety
    res.json({ success: true, news, count: news.length });
  } catch (error) {
    console.error('❌ Error in /api/news/public:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch trending news' });
  }
});

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

    // Use fetchNewsByCategory which returns pre-grouped news
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

function getOAuthErrorMessage(error, fallback = 'OAuth request failed') {
  const data = error.response?.data;
  if (!data) return error.message || fallback;
  if (typeof data === 'string') {
    if (data.trim().startsWith('<!DOCTYPE html') || data.trim().startsWith('<html')) {
      return error.response?.status >= 500
        ? `${fallback}. The provider returned a temporary server error. Please try again in a few minutes.`
        : fallback;
    }
    return data.replace(/\s+/g, ' ').trim().slice(0, 240) || fallback;
  }
  return data.error_description || data.message || data.error || fallback;
}

function logOAuthProviderError(label, error) {
  const data = error.response?.data;
  const body = typeof data === 'string'
    ? data.replace(/\s+/g, ' ').trim().slice(0, 500)
    : JSON.stringify(data);

  console.error(`${label}:`, {
    status: error.response?.status,
    contentType: error.response?.headers?.['content-type'],
    body: body || error.message
  });
}

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
      const message = req.query.error_description || req.query.error || 'LinkedIn authorization was cancelled or rejected';
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=linkedin_denied&message=${encodeURIComponent(message)}`);
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=linkedin_missing_params&message=Missing+LinkedIn+authorization+parameters`);
    }

    // Decrypt state to get userId
    let userId;
    try {
      userId = decryptState(state);
      console.log('  - Decrypted user ID:', userId);
    } catch (stateError) {
      console.error('State decryption error:', stateError.message);
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=linkedin_invalid_state&message=LinkedIn+authorization+session+expired,+please+try+again`);
    }

    // Exchange code for access token
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/linkedin/callback`;
    console.log('  - Exchange token with redirect URI:', redirectUri);

    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: redirectUri
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    } catch (tokenError) {
      logOAuthProviderError('LinkedIn token exchange error', tokenError);
      const msg = getOAuthErrorMessage(tokenError, 'LinkedIn token exchange failed');
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=linkedin_token_exchange_failed&message=${encodeURIComponent(msg)}`);
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
    res.redirect(`${getFrontendUrl()}/connect-accounts?error=linkedin_failed&message=${encodeURIComponent(error.message)}`);
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

    // Capture the frontend origin so the callback can redirect back to the
    // correct domain (e.g. socialmediaautomator.com vs railway URL).
    const frontendUrl = req.headers.origin || (req.protocol + '://' + req.get('host'));

    // Build the redirect URI once here and store it in PKCE data so the
    // token exchange in the callback uses the EXACT same URI. Mismatch
    // between auth URL redirectUri and token exchange redirectUri is the
    // most common cause of Twitter token exchange failure.
    const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;

    // Store code_verifier temporarily (expires in 30 minutes)
    // Store in both in-memory and session stores for redundancy
    const pkceData = { codeVerifier, userId, frontendUrl, redirectUri, timestamp: Date.now() };
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
          frontend_url: frontendUrl,
          redirect_uri: redirectUri,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });
    } catch (dbError) {
      console.warn('Could not save PKCE to database:', dbError.message);
    }

    setTimeout(() => {
      pkceStore.delete(state);
      sessionPkceStore.delete(state);
    }, 30 * 60 * 1000);
    const scope = 'tweet.read tweet.write users.read offline.access';

    console.log('🐦 Twitter OAuth URL generation:');
    console.log('  - Client ID:', clientId ? 'exists' : 'missing');
    console.log('  - Redirect URI:', redirectUri);
    console.log('  - State:', state.substring(0, 20) + '...');

    const authUrl = new URL('https://x.com/i/oauth2/authorize');
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
  let callbackFrontendUrl = getFrontendUrl(); // default; overwritten once PKCE is resolved
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
            frontendUrl: dbState.frontend_url || null,
            redirectUri: dbState.redirect_uri || null,
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
      return res.redirect(`${getFrontendUrl()}/connect-accounts?error=twitter_expired&message=Session+expired,+please+try+again`);
    }

    const { codeVerifier, userId, frontendUrl: storedFrontendUrl, redirectUri: storedRedirectUri } = pkceData;
    callbackFrontendUrl = storedFrontendUrl || getFrontendUrl();
    // Use the exact redirectUri that was sent during auth URL generation.
    // This MUST match or Twitter will reject the token exchange.
    const redirectUri = storedRedirectUri || (process.env.APP_URL
      ? `${process.env.APP_URL}/auth/twitter/callback`
      : `${callbackFrontendUrl}/auth/twitter/callback`);
    console.log('  - User ID from PKCE:', userId);
    console.log('  - Frontend URL for redirect:', callbackFrontendUrl);
    console.log('  - Token exchange redirect URI:', redirectUri);
    pkceStore.delete(state); // Clean up

    let tokenResponse;
    try {
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      });
      console.log('  - Token exchange params:', {
        grant_type: 'authorization_code',
        code: code ? code.substring(0, 20) + '...' : 'missing',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier ? codeVerifier.substring(0, 10) + '...' : 'missing',
        client_id_in_basic_auth: process.env.TWITTER_CLIENT_ID ? 'yes' : 'missing'
      });
      tokenResponse = await axios.post('https://api.x.com/2/oauth2/token', tokenParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
        }
      });
      console.log('  - Token exchange successful');
    } catch (tokenError) {
      logOAuthProviderError('Twitter token exchange error', tokenError);
      const twitterError = tokenError.response?.data;
      console.error('  - redirect_uri used:', redirectUri);
      console.error('  - Twitter error code:', twitterError?.error);
      console.error('  - Twitter error description:', twitterError?.error_description);
      const msg = getOAuthErrorMessage(tokenError, 'Twitter token exchange failed');
      return res.redirect(`${callbackFrontendUrl}/connect-accounts?error=twitter_token_exchange_failed&message=${encodeURIComponent(msg)}`);
    }

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user profile
    let profile = { id: null, username: 'unknown' };
    try {
      const profileResponse = await axios.get('https://api.x.com/2/users/me', {
        params: { 'user.fields': 'id,name,username' },
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      profile = profileResponse.data.data;
      console.log('  - Profile fetched:', profile.username);
    } catch (profileError) {
      console.error('  - Failed to fetch Twitter profile:', profileError.response?.status, JSON.stringify(profileError.response?.data));
      console.warn('  - Proceeding with token storage despite profile fetch failure');
    }
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

    // Combine OAuth 2.0 refresh token with any existing OAuth 1.0a credentials
    // Storage format: oauth2_refresh_token:oauth1_access_token:oauth1_access_secret
    let finalRefreshToken = refresh_token;
    if (existingAccounts && existingAccounts.length > 0) {
      for (const account of existingAccounts) {
        const existingToken = account.refresh_token;
        if (!existingToken) continue;

        const parts = existingToken.split(':');
        const firstPartIsOAuth1 = /^\d+-\w/.test(parts[0]);

        if (firstPartIsOAuth1) {
          // Existing is OAuth 1.0a only — combine with new OAuth 2.0 refresh token
          finalRefreshToken = `${refresh_token}:${existingToken}`;
          console.log(`   🔒 Combined OAuth 2.0 refresh token + OAuth 1.0a credentials for: ${account.platform_username}`);
        } else if (parts.length >= 3 && /^\d+-\w/.test(parts[1])) {
          // Existing is combined format — update OAuth 2.0 portion, keep OAuth 1.0a portion
          const oauth1Part = parts.slice(1).join(':');
          finalRefreshToken = `${refresh_token}:${oauth1Part}`;
          console.log(`   🔒 Updated OAuth 2.0 refresh token, preserved OAuth 1.0a credentials for: ${account.platform_username}`);
        }
        // else: OAuth 2.0 only existing token — just use new refresh token
        break;
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
    res.redirect(`${callbackFrontendUrl}/connect-accounts?connected=twitter&success=true`);
  } catch (error) {
    console.error('Error in Twitter callback:', error.message);
    res.redirect(`${callbackFrontendUrl || getFrontendUrl()}/connect-accounts?error=twitter_failed&message=${encodeURIComponent(error.message)}`);
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
 * GET /api/business/profile
 * Get user's business profile (protected)
 */
app.get('/api/business/profile', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getBusinessProfile(userId);

    if (!profile) {
      return res.json({
        success: true,
        profile: null,
        hasProfile: false
      });
    }

    res.json({
      success: true,
      profile,
      hasProfile: true
    });
  } catch (error) {
    console.error('Error getting business profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get business profile'
    });
  }
});

/**
 * POST /api/business/profile
 * Create or update business profile (protected)
 */
app.post('/api/business/profile', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Validate required field
    if (!profileData.business_name || profileData.business_name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Business name is required'
      });
    }

    const profile = await upsertBusinessProfile(userId, profileData);

    res.json({
      success: true,
      profile,
      message: 'Business profile saved successfully'
    });
  } catch (error) {
    console.error('Error saving business profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save business profile'
    });
  }
});

/**
 * DELETE /api/business/profile
 * Delete business profile (soft delete) (protected)
 */
app.delete('/api/business/profile', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await deleteBusinessProfile(userId);

    res.json({
      success: true,
      message: 'Business profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete business profile'
    });
  }
});

/**
 * POST /api/business/autofill
 * Extract business data from website URL (protected)
 */
app.post('/api/business/autofill', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { websiteUrl } = req.body;

    if (!websiteUrl || !websiteUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Website URL is required'
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

    console.log(`🔍 Auto-filling business profile from: ${websiteUrl} for user ${userId}`);

    const result = await extractBusinessDataFromWebsite(websiteUrl);

    // Increment AI usage
    await incrementUsage(userId, 'ai');

    res.json({
      success: true,
      data: result.data,
      extractedFields: result.extractedFields,
      message: `Successfully extracted ${result.extractedFields.length} fields from website`
    });
  } catch (error) {
    console.error('Error auto-filling business profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract business data from website'
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

    console.log('🔍 Subscription request:', {
      plan,
      billingCycle,
      planId,
      monthlyPlanId: planConfig.razorpay_monthly_plan_id,
      annualPlanId: planConfig.razorpay_annual_plan_id,
      envVars: {
        RAZORPAY_PRO_MONTHLY_PLAN_ID: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID ? `SET (${process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID.substring(0, 15)}...)` : 'NOT SET',
        RAZORPAY_PRO_ANNUAL_PLAN_ID: process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID ? `SET (${process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID.substring(0, 15)}...)` : 'NOT SET',
        RAZORPAY_BUSINESS_MONTHLY_PLAN_ID: process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID ? `SET (${process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID.substring(0, 15)}...)` : 'NOT SET',
        RAZORPAY_BUSINESS_ANNUAL_PLAN_ID: process.env.RAZORPAY_BUSINESS_ANNUAL_PLAN_ID ? `SET (${process.env.RAZORPAY_BUSINESS_ANNUAL_PLAN_ID.substring(0, 15)}...)` : 'NOT SET'
      }
    });

    if (!planId) {
      const missingPlan = billingCycle === 'annual' ? 'annual' : 'monthly';
      const envVarName = `RAZORPAY_${plan.toUpperCase()}_${missingPlan.toUpperCase()}_PLAN_ID`;
      console.error(`❌ Missing Razorpay ${missingPlan} plan ID for ${plan} plan`);
      console.error(`❌ Expected environment variable: ${envVarName}`);
      console.error(`❌ Current value: ${process.env[envVarName] || 'undefined'}`);
      return res.status(400).json({
        success: false,
        error: `Razorpay ${missingPlan} Plan ID not configured for ${plan} plan. Please contact support.`,
        details: `Environment variable ${envVarName} is not set or is empty.`
      });
    }

    const result = await createSubscription(userId, planId, billingCycle);
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

/**
 * GET /api/billing/ai-spending
 * Get AI API spending summary (daily/monthly)
 */
app.get('/api/billing/ai-spending', verifyAuth, async (req, res) => {
  try {
    const { getSpendingSummary } = require('./services/ai-wrapper');
    const summary = await getSpendingSummary();

    res.json({
      success: true,
      spending: {
        today: summary.today,
        month: summary.month,
        limitDaily: summary.limitDaily,
        limitMonthly: summary.limitMonthly,
        remainingDaily: summary.remainingDaily,
        remainingMonthly: summary.remainingMonthly,
        percentageDaily: ((summary.today / summary.limitDaily) * 100).toFixed(1),
        percentageMonthly: ((summary.month / summary.limitMonthly) * 100).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error getting AI spending:', error);
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

// CATCH-ALL ROUTE FOR REACT SPA (must be last)
// ============================================

// Serve React Dashboard for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes, auth routes, assets, and vite.svg (already served above)
  if (req.path.startsWith('/api/') ||
    req.path.startsWith('/auth') ||
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
// CACHE MANAGEMENT ENDPOINTS
// ============================================
const cache = require('./services/cache');

// Get cache statistics
app.get('/api/admin/cache/stats', verifyAuth, async (req, res) => {
  try {
    // Only admins can view cache stats
    const stats = cache.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear cache for current user (useful after making changes)
app.post('/api/admin/cache/clear-user', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    cache.invalidateUserCache(userId);
    res.json({
      success: true,
      message: `Cache cleared for user ${userId}`
    });
  } catch (error) {
    console.error('Error clearing user cache:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear specific cache categories for current user
app.post('/api/admin/cache/clear-categories', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { categories } = req.body;
    cache.invalidateUserCacheByCategory(userId, categories || []);
    res.json({
      success: true,
      message: `Cache cleared for categories: ${(categories || []).join(', ')}`
    });
  } catch (error) {
    console.error('Error clearing cache categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================

// Error handling middleware (must be last)
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
// Register brand voice bootstrap routes
brandVoiceBootstrapRoutes(app, verifyAuth);

app.use(notFoundHandler); // 404 handler for undefined routes
app.use(errorHandler); // Global error handler

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 SOCIAL MEDIA AUTOMATOR');
  console.log('='.repeat(50));
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`${schedulerDisabled ? '⏸️' : '✅'} Queue processor ${schedulerDisabled ? 'disabled' : 'active'}`);

  // Check database connection
  const dbHealthy = await healthCheck();
  console.log(`${dbHealthy ? '✅' : '❌'} Database: ${dbHealthy ? 'Connected to Supabase' : 'Disconnected'}`);

  console.log(`\n📋 API Endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/accounts - List all accounts`);
  console.log(`   POST /api/post/now - Post immediately`);
  console.log(`   POST /api/post/schedule - Schedule a post`);
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
