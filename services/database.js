const { createClient } = require('@supabase/supabase-js');
const cache = require('./cache');

// Initialize Supabase client (ANON key - respects RLS)
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Supabase admin client (SERVICE_ROLE key - bypasses RLS for backend operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Add a post to the queue (with user_id for multi-tenant)
 * Uses supabaseAdmin to bypass RLS for backend operations
 */
async function addPost(postData) {
  try {
    const insertData = {
      text: postData.text,
      image_url: postData.imageUrl,
      platforms: postData.platforms,
      schedule_time: postData.scheduleTime,
      status: 'queued',
      created_at: new Date().toISOString()
    };

    // Add user_id if provided (for multi-tenant)
    if (postData.userId) {
      insertData.user_id = postData.userId;
    }

    // Use supabaseAdmin to bypass RLS for backend operations
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Added to database queue (ID: ${data.id}, User: ${postData.userId || 'N/A'})`);

    // Invalidate cache for this user so analytics are updated immediately
    if (postData.userId) {
      cache.invalidateUserCache(postData.userId);
    }

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

    const { data, error } = await supabaseAdmin
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
 * Uses supabaseAdmin to bypass RLS for backend operations
 */
async function updatePostStatus(postId, status, results = null) {
  try {
    const updateData = {
      status: status,
      posted_at: new Date().toISOString()
    };

    if (results) {
      // Ensure results is properly formatted (object, not string)
      // If it's already an object, use it directly
      // If it's a string, try to parse it
      if (typeof results === 'string') {
        try {
          updateData.results = JSON.parse(results);
        } catch (e) {
          console.warn('⚠️  Results is a string but not valid JSON, saving as object:', results);
          updateData.results = results;
        }
      } else {
        updateData.results = results;
      }

    }

    // Use supabaseAdmin to bypass RLS for backend operations
    const { data, error } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error(`❌ Database update error:`, error);
      throw error;
    }

    if (data && data.user_id) {
      cache.invalidateUserCache(data.user_id);
    }

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
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      const deletedPost = data[0];
      if (deletedPost.user_id) {
        cache.invalidateUserCache(deletedPost.user_id);
      }
    }

    console.log(`🗑️ Deleted post ${postId} from queue`);
    return true;
  } catch (error) {
    console.error('❌ Database error (deletePost):', error.message);
    return false;
  }
}

/**
 * Get post history (last N posts) - multi-tenant aware
 * Uses supabaseAdmin to bypass RLS for backend queries
 */
async function getPostHistory(limit = 50, userId = null) {
  try {
    let query = supabaseAdmin
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by user_id if provided (multi-tenant)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Parse results if they're stored as JSON strings
    const parsedData = (data || []).map(post => {
      if (post.results && typeof post.results === 'string') {
        try {
          post.results = JSON.parse(post.results);
        } catch (e) {
          console.warn(`⚠️  Failed to parse results JSON for post ${post.id}:`, e);
        }
      }
      return post;
    });

    console.log(`📋 Retrieved ${parsedData.length || 0} posts from history for user ${userId || 'all'}`);
    return parsedData;
  } catch (error) {
    console.error('❌ Database error (getPostHistory):', error.message);
    return [];
  }
}

/**
 * Get analytics - success rate by platform (multi-tenant)
 */
async function getPlatformStats(userId = null) {
  try {
    // Check cache first
    const cacheKey = userId ? `platform_stats:${userId}` : 'platform_stats:global';
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let query = supabaseAdmin
      .from('posts')
      .select('platforms, status, results, user_id')
      .in('status', ['posted', 'failed', 'partial']);

    // Filter by user if provided (multi-tenant)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate stats per platform
    const stats = {};

    data.forEach(post => {
      // Handle platforms as JSON string or array
      let platforms = post.platforms;
      if (typeof platforms === 'string') {
        try {
          platforms = JSON.parse(platforms);
        } catch (e) {
          console.warn('Failed to parse platforms JSON:', platforms);
          platforms = [];
        }
      }

      if (!Array.isArray(platforms)) {
        platforms = [];
      }

      platforms.forEach(platform => {
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

    // Cache the result
    cache.set(cacheKey, stats, cache.CACHE_DURATIONS.platform_stats);

    return stats;
  } catch (error) {
    console.error('❌ Database error (getPlatformStats):', error.message);
    return {};
  }
}

/**
 * Get analytics overview for a user
 */
async function getAnalyticsOverview(userId) {
  try {
    // Check cache first
    const cacheKey = `analytics_overview:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Run all independent queries in parallel
    const [
      { count: totalPosts },
      { count: postsThisMonth },
      { count: postsToday },
      { count: scheduledCount },
      { data: completedPosts },
      { data: platformPosts }
    ] = await Promise.all([
      // Total posts
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),

      // Posts this month
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startOfMonth.toISOString()),

      // Posts today
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startOfDay.toISOString()),

      // Scheduled count
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'queued'),

      // Completed posts (for success rate)
      supabaseAdmin.from('posts').select('status').eq('user_id', userId).in('status', ['posted', 'failed', 'partial']),

      // Active platforms
      supabaseAdmin.from('posts').select('platforms').eq('user_id', userId)
    ]);

    // Calculate success rate
    const successfulPosts = completedPosts ? completedPosts.filter(p => p.status === 'posted').length : 0;
    const totalCompleted = completedPosts ? completedPosts.length : 0;
    const successRate = totalCompleted > 0 ? Math.round((successfulPosts / totalCompleted) * 100) : 0;

    // Calculate active platforms
    const platformSet = new Set();
    if (platformPosts) {
      platformPosts.forEach(post => {
        if (post.platforms && Array.isArray(post.platforms)) {
          post.platforms.forEach(p => platformSet.add(p));
        }
      });
    }
    const activePlatforms = platformSet.size;

    const result = {
      totalPosts: totalPosts || 0,
      postsThisMonth: postsThisMonth || 0,
      postsToday: postsToday || 0,
      scheduledCount: scheduledCount || 0,
      successRate,
      activePlatforms
    };

    // Cache the result
    cache.set(cacheKey, result, cache.CACHE_DURATIONS.analytics_overview);

    return result;
  } catch (error) {
    console.error('❌ Database error (getAnalyticsOverview):', error.message);
    return {
      totalPosts: 0,
      postsThisMonth: 0,
      successRate: 0,
      activePlatforms: 0
    };
  }
}

/**
 * Get timeline data for last N days (for chart)
 */
async function getTimelineData(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all posts in date range
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('created_at, status, results')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Create date arrays
    const dates = [];
    const successful = [];
    const failed = [];

    // Generate all dates in range
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date.toISOString().split('T')[0]);
      successful.push(0);
      failed.push(0);
    }

    // Count posts per day
    if (data && data.length > 0) {
      data.forEach(post => {
        const postDate = new Date(post.created_at).toISOString().split('T')[0];
        const dateIndex = dates.indexOf(postDate);

        if (dateIndex >= 0) {
          // Count as successful if status is 'posted'
          if (post.status === 'posted') {
            successful[dateIndex]++;
          } else if (post.status === 'failed') {
            failed[dateIndex]++;
          } else if (post.status === 'partial') {
            // For partial, count successes and failures from results
            if (post.results) {
              let hasSuccess = false;
              let hasFailure = false;

              Object.values(post.results).forEach(result => {
                if (result.success) hasSuccess = true;
                else hasFailure = true;
              });

              if (hasSuccess) successful[dateIndex]++;
              if (hasFailure) failed[dateIndex]++;
            }
          }
        }
      });
    }

    return {
      dates,
      successful,
      failed
    };
  } catch (error) {
    console.error('❌ Database error (getTimelineData):', error.message);
    return {
      dates: [],
      successful: [],
      failed: []
    };
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
  supabaseAdmin,
  addPost,
  getDuePosts,
  getAllQueuedPosts,
  updatePostStatus,
  deletePost,
  getPostHistory,
  getPlatformStats,
  getAnalyticsOverview,
  getTimelineData,
  cleanupOldPosts,
  healthCheck
};

