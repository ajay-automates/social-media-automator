require('dotenv').config();
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
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Import Services and Utilities
const { supabase, supabaseAdmin } = require('./utilities/supabase');
const { verifyAuth } = require('./middleware/auth');
const { startScheduler } = require('./services/scheduler');
const { healthCheck } = require('./services/database');

// Import Routers
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const webhooksRouter = require('./routes/webhooks');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use(cors());
// Note: Body parsing middleware is applied globally, but webhook routes might need raw body.
// The webhook router handles its own raw body parsing if needed, or we can conditionally apply.
// For simplicity here, we apply JSON/URL-encoded globally EXCEPT for specific paths if needed.
// However, the stripe webhook in routes/webhooks.js uses express.raw(), so we should be careful.
// Standard practice: Apply body parsers to non-webhook routes.

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/webhooks')) {
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/webhooks')) {
    next();
  } else {
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'dashboard/dist')));
app.use('/landing', express.static(path.join(__dirname, 'landing/dist')));

// Mount Routers
app.use('/auth', authRouter); // Auth routes (e.g. /auth/linkedin/callback)
app.use('/api/auth', authRouter); // API Auth routes (e.g. /api/auth/linkedin/url)
app.use('/api', apiRouter); // General API routes
app.use('/webhooks', webhooksRouter); // Webhook routes

// Root route - Serve landing page or dashboard
app.get('/', (req, res) => {
  // If user is logged in or has session, redirect to dashboard
  // For now, just serve landing page if built, otherwise dashboard
  if (fsSync.existsSync(path.join(__dirname, 'landing/dist/index.html'))) {
    res.sendFile(path.join(__dirname, 'landing/dist/index.html'));
  } else {
    res.redirect('/dashboard');
  }
});

// Dashboard route - Catch-all for React routing
app.get('/dashboard*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/dist/index.html'));
});

// Connect Accounts route - React routing
app.get('/connect-accounts*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/dist/index.html'));
});

// Settings route - React routing
app.get('/settings*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/dist/index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Check database connection
  const dbHealth = await healthCheck();
  if (dbHealth) {
    console.log('✅ Database connected');
  } else {
    console.error('❌ Database connection failed');
  }

  // Start scheduler
  startScheduler();
  console.log('⏰ Scheduler started');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
