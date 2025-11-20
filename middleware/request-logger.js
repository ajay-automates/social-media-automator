/**
 * Request Logger Middleware
 * 
 * Logs all HTTP requests with custom format including user ID and response time.
 * Uses morgan for efficient logging.
 */

const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Custom token for user ID
morgan.token('user-id', (req) => {
    return req.user?.id || 'anonymous';
});

// Custom token for request body size
morgan.token('body-size', (req) => {
    return req.headers['content-length'] || '0';
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format: method url status response-time - user-id
const customFormat = ':method :url :status :response-time ms - user::user-id';

// Development logger - console only
const devLogger = morgan(customFormat, {
    skip: (req) => {
        // Skip logging for static files and health checks in dev
        return req.url.startsWith('/assets') ||
            req.url.endsWith('.js') ||
            req.url.endsWith('.css') ||
            req.url.endsWith('.png') ||
            req.url.endsWith('.jpg') ||
            req.url.endsWith('.svg');
    }
});

// Production logger - file and console
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' } // append mode
);

const prodLogger = morgan(customFormat, {
    stream: accessLogStream,
    skip: (req) => {
        // Skip logging for static files in production
        return req.url.startsWith('/assets') ||
            req.url.endsWith('.js') ||
            req.url.endsWith('.css');
    }
});

// Error logger - separate file for errors only
const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
);

const errorLogger = morgan(customFormat, {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400 // Only log errors (4xx, 5xx)
});

// Export appropriate logger based on environment
const requestLogger = process.env.NODE_ENV === 'production'
    ? [prodLogger, errorLogger, devLogger] // Log to file and console in production
    : devLogger; // Console only in development

module.exports = requestLogger;
