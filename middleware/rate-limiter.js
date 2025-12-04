/**
 * Rate Limiting Middleware
 * 
 * Implements tiered rate limiting to protect against API abuse:
 * - AI Endpoints: 50 requests/hour (strictest - expensive API calls)
 * - Auth Endpoints: 10 requests/15min (prevent brute force)
 * - General API: 100 requests/15min (moderate protection)
 * - Public Routes: 200 requests/15min (lenient for public access)
 */

const rateLimit = require('express-rate-limit');

// ============================================
// TIER 1: AI Endpoints (Strictest)
// ============================================
// Protects expensive AI API calls (Anthropic, Stability AI)
// Limit: 50 requests per hour per IP (500 in development)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 50 : 500,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: {
        success: false,
        error: {
            message: 'Too many AI requests from this IP. Please try again in an hour.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '1 hour',
            limit: 50,
            window: '1 hour'
        }
    },
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
        console.warn('⚠️  AI Rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many AI requests from this IP. Please try again in an hour.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: '1 hour',
                limit: 50,
                window: '1 hour'
            }
        });
    }
});

// ============================================
// TIER 2: Auth Endpoints (Strict)
// ============================================
// Prevents brute force attacks on authentication
// Limit: 10 requests per 15 minutes per IP (100 in development)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
            limit: 10,
            window: '15 minutes'
        }
    },
    handler: (req, res) => {
        console.warn('⚠️  Auth rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: '15 minutes',
                limit: 10,
                window: '15 minutes'
            }
        });
    }
});

// ============================================
// TIER 3: General API (Moderate)
// ============================================
// Standard protection for general API endpoints
// Limit: 100 requests per 15 minutes per IP (1000 in development)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many requests from this IP. Please try again in 15 minutes.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
            limit: 100,
            window: '15 minutes'
        }
    },
    handler: (req, res) => {
        console.warn('⚠️  API rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many requests from this IP. Please try again in 15 minutes.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: '15 minutes',
                limit: 100,
                window: '15 minutes'
            }
        });
    }
});

// ============================================
// TIER 4: Public Routes (Lenient)
// ============================================
// Higher limit for public endpoints and static content
// Limit: 200 requests per 15 minutes per IP (2000 in development)
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 200 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Don't rate limit health checks
        return req.path === '/api/health';
    },
    message: {
        success: false,
        error: {
            message: 'Too many requests from this IP. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
            limit: 200,
            window: '15 minutes'
        }
    }
});

// ============================================
// Development Mode Overrides
// ============================================
// In development, use higher limits for easier testing
if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  Rate limiting enabled with development limits (higher thresholds)');
}

module.exports = {
    aiLimiter,
    authLimiter,
    apiLimiter,
    publicLimiter
};
