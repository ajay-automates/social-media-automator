require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files (index.html)

// Start the queue processor
startQueueProcessor();

// ============================================
// API ROUTES
// ============================================

/**
 * Health check
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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
 * Get all accounts with their platform availability
 */
app.get('/api/accounts', (req, res) => {
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
 * Post immediately to selected platforms from selected account
 */
app.post('/api/post/now', async (req, res) => {
  try {
    const { text, imageUrl, platforms, accountId = 1 } = req.body;
    console.log('Received platforms:', platforms, typeof platforms);
    console.log('Using account ID:', accountId);
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }
    
    // Get credentials for the selected account
    const credentials = getAllCredentials(accountId);
    
    // Validate credentials
    if (!credentials.linkedin.accessToken) {
      return res.status(500).json({
        success: false,
        error: 'LinkedIn credentials not configured. Check your .env file.'
      });
    }
    
    const result = await postNow(text, imageUrl || null, platforms, credentials);
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/post/now:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/post/schedule
 * Schedule a post for later from selected account
 */
app.post('/api/post/schedule', (req, res) => {
  try {
    const { text, imageUrl, platforms, scheduleTime, accountId = 1 } = req.body;
    console.log('Scheduling post for account ID:', accountId);
    
    if (!text || !scheduleTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text and scheduleTime are required' 
      });
    }
    
    // Get credentials for the selected account
    const credentials = getAllCredentials(accountId);
    
    // Validate credentials
    if (!credentials.linkedin.accessToken) {
      return res.status(500).json({
        success: false,
        error: 'LinkedIn credentials not configured. Check your .env file.'
      });
    }
    
    const queueItem = schedulePost(
      text, 
      imageUrl || null,
      platforms || ['linkedin'],
      scheduleTime, 
      credentials
    );
    
    res.json({ 
      success: true, 
      message: 'Post scheduled successfully!',
      post: {
        id: queueItem.id,
        scheduleTime: queueItem.scheduleTime
      }
    });
  } catch (error) {
    console.error('Error in /api/post/schedule:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/post/bulk
 * Schedule multiple posts at once (supports different accounts per post)
 */
app.post('/api/post/bulk', (req, res) => {
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
 * GET /api/queue
 * Get all queued posts
 */
app.get('/api/queue', async (req, res) => {
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
 * Delete a post from queue
 */
app.delete('/api/queue/:id', async (req, res) => {
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
 * Get post history
 */
app.get('/api/history', async (req, res) => {
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
 * Get platform statistics
 */
app.get('/api/analytics/platforms', async (req, res) => {
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
 * POST /api/ai/generate
 * Generate AI captions using Claude
 */
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { topic, niche, platform } = req.body;
    
    // Validate inputs
    if (!topic || topic.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic is required' 
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
  console.log(`   GET  /api/queue - View queue`);
  console.log(`   DELETE /api/queue/:id - Remove from queue`);
  console.log(`   GET  /api/history - View post history`);
  console.log(`   GET  /api/analytics/platforms - Platform statistics`);
  console.log(`   POST /api/ai/generate - Generate AI captions`);
  console.log('\n' + '='.repeat(50) + '\n');
});
