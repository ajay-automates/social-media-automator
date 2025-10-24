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

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'running',
    uptime: process.uptime(),
    queueSize: getQueue().length,
    message: '🚀 Social Media Automator is live!'
  });
});

/**
 * POST /api/post/now
 * Post immediately to LinkedIn
 */
app.post('/api/post/now', async (req, res) => {
  try {
    const { text, imageUrl } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }
    
    const credentials = {
      linkedin: {
        accessToken: process.env.LINKEDIN_TOKEN,
        urn: process.env.LINKEDIN_URN,
        type: process.env.LINKEDIN_TYPE
      }
    };
    
    // Validate credentials
    if (!credentials.linkedin.accessToken) {
      return res.status(500).json({
        success: false,
        error: 'LinkedIn credentials not configured. Check your .env file.'
      });
    }
    
    const result = await postNow(text, imageUrl || null, credentials);
    
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
 * Schedule a post for later
 */
app.post('/api/post/schedule', (req, res) => {
  try {
    const { text, imageUrl, scheduleTime } = req.body;
    
    if (!text || !scheduleTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text and scheduleTime are required' 
      });
    }
    
    const credentials = {
      linkedin: {
        accessToken: process.env.LINKEDIN_TOKEN,
        urn: process.env.LINKEDIN_URN,
        type: process.env.LINKEDIN_TYPE
      }
    };
    
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
 * Schedule multiple posts at once
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
    
    const credentials = {
      linkedin: {
        accessToken: process.env.LINKEDIN_TOKEN,
        urn: process.env.LINKEDIN_URN,
        type: process.env.LINKEDIN_TYPE
      }
    };
    
    const scheduled = [];
    
    posts.forEach(post => {
      if (post.text && post.scheduleTime) {
        const queueItem = schedulePost(
          post.text,
          post.imageUrl || null,
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
app.get('/api/queue', (req, res) => {
  res.json({ 
    queue: getQueue() 
  });
});

/**
 * DELETE /api/queue/:id
 * Delete a post from queue
 */
app.delete('/api/queue/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const deleted = deleteFromQueue(postId);
  
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
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 SOCIAL MEDIA AUTOMATOR');
  console.log('='.repeat(50));
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Queue processor active`);
  console.log(`\n📋 API Endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/post/now - Post immediately`);
  console.log(`   POST /api/post/schedule - Schedule a post`);
  console.log(`   POST /api/post/bulk - Schedule multiple posts`);
  console.log(`   GET  /api/queue - View queue`);
  console.log(`   DELETE /api/queue/:id - Remove from queue`);
  console.log('\n' + '='.repeat(50) + '\n');
});
