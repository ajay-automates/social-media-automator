/**
 * Centralized Error Handler Middleware
 * 
 * Catches all errors from routes and formats them consistently.
 * Provides detailed errors in development, sanitized errors in production.
 */

class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error for debugging
    console.error('❌ Error:', {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        userId: req.user?.id || 'anonymous',
        timestamp: new Date().toISOString()
    });

    // Default error values
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let code = error.code || 'INTERNAL_ERROR';

    // Handle specific error types

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = err.message;
    }

    // Unauthorized errors
    if (err.name === 'UnauthorizedError' || err.message?.includes('Unauthorized')) {
        statusCode = 401;
        code = 'UNAUTHORIZED';
        message = 'Authentication required';
    }

    // Forbidden errors
    if (err.name === 'ForbiddenError' || err.message?.includes('Forbidden')) {
        statusCode = 403;
        code = 'FORBIDDEN';
        message = 'Access denied';
    }

    // Not found errors
    if (err.name === 'NotFoundError' || err.message?.includes('not found')) {
        statusCode = 404;
        code = 'NOT_FOUND';
        message = err.message || 'Resource not found';
    }

    // Rate limit errors
    if (err.name === 'RateLimitError' || err.message?.includes('Too many requests')) {
        statusCode = 429;
        code = 'RATE_LIMIT_EXCEEDED';
        message = 'Too many requests, please try again later';
    }

    // Supabase/Database errors
    if (err.code?.startsWith('PGRST') || err.code?.startsWith('23')) {
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Authentication token expired';
    }

    // Build error response
    const errorResponse = {
        success: false,
        error: {
            message,
            code
        }
    };

    // Add stack trace and details in development
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.error.stack = error.stack;
        errorResponse.error.details = {
            originalMessage: err.message,
            name: err.name,
            path: req.path,
            method: req.method
        };
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
}

// 404 handler for undefined routes
function notFoundHandler(req, res, next) {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404,
        'NOT_FOUND'
    );
    next(error);
}

module.exports = {
    errorHandler,
    notFoundHandler,
    AppError
};
