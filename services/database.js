const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Add a post to the queue
 */
async function addPost(postData) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        text: postData.text,
        image_url: postData.imageUrl,
        platforms: postData.platforms,
        schedule_time: postData.scheduleTime,
        status: 'queued',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Added to database queue (ID: ${data.id})`);
    return data;
  } catch (error) {
    console.error('❌ Database error (addPost):', error.message);
    throw error;
  }
}

/**
 * Get all queued posts that are due to be posted
 */
async function getDuePosts() {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'queued')
      .lte('schedule_time', now)
      .order('schedule_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Database error (getDuePosts):', error.message);
    return [];
  }
}

/**
 * Get all posts in queue (for display)
 */
async function getAllQueuedPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('status', ['queued', 'posted', 'failed', 'partial'])
      .order('schedule_time', { ascending: true })
      .limit(100);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Database error (getAllQueuedPosts):', error.message);
    return [];
  }
}

/**
 * Update post status after posting
 */
async function updatePostStatus(postId, status, results = null) {
  try {
    const updateData = {
      status: status,
      posted_at: new Date().toISOString()
    };
    
    if (results) {
      updateData.results = results;
    }
    
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`❌ Database error (updatePostStatus):`, error.message);
    throw error;
  }
}

/**
 * Delete a post from queue
 */
async function deletePost(postId) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (error) throw error;
    console.log(`🗑️ Deleted post ${postId} from queue`);
    return true;
  } catch (error) {
    console.error('❌ Database error (deletePost):', error.message);
    return false;
  }
}

/**
 * Get post history (last N posts)
 */
async function getPostHistory(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Database error (getPostHistory):', error.message);
    return [];
  }
}

/**
 * Get analytics - success rate by platform
 */
async function getPlatformStats() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('platforms, status, results')
      .in('status', ['posted', 'failed', 'partial']);
    
    if (error) throw error;
    
    // Calculate stats per platform
    const stats = {};
    
    data.forEach(post => {
      post.platforms.forEach(platform => {
        if (!stats[platform]) {
          stats[platform] = { total: 0, successful: 0, failed: 0 };
        }
        
        stats[platform].total++;
        
        if (post.results && post.results[platform]) {
          if (post.results[platform].success) {
            stats[platform].successful++;
          } else {
            stats[platform].failed++;
          }
        }
      });
    });
    
    // Calculate success rates
    Object.keys(stats).forEach(platform => {
      const s = stats[platform];
      s.successRate = s.total > 0 ? Math.round((s.successful / s.total) * 100) : 0;
    });
    
    return stats;
  } catch (error) {
    console.error('❌ Database error (getPlatformStats):', error.message);
    return {};
  }
}

/**
 * Cleanup old posts (older than 7 days)
 */
async function cleanupOldPosts() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .neq('status', 'queued')
      .lt('posted_at', sevenDaysAgo.toISOString())
      .select();
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`🧹 Cleaned up ${data.length} old post(s) from database`);
    }
    
    return data ? data.length : 0;
  } catch (error) {
    console.error('❌ Database error (cleanupOldPosts):', error.message);
    return 0;
  }
}

/**
 * Health check - test database connection
 */
async function healthCheck() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  addPost,
  getDuePosts,
  getAllQueuedPosts,
  updatePostStatus,
  deletePost,
  getPostHistory,
  getPlatformStats,
  cleanupOldPosts,
  healthCheck
};

