/**
 * Content Recycling Engine
 * Automatically repost best-performing content to maintain engagement
 */

const { createClient } = require('@supabase/supabase-js');
const { schedulePost } = require('./scheduler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user's recycling settings (or create default if doesn't exist)
 */
async function getRecyclingSettings(userId) {
  try {
    let { data: settings, error } = await supabase
      .from('content_recycling_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no settings exist, create default ones
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: insertError } = await supabase
        .from('content_recycling_settings')
        .insert({
          user_id: userId,
          auto_recycle_enabled: false,
          minimum_age_days: 30,
          minimum_success_rate: 80.0,
          minimum_engagement_score: 70,
          max_recycles_per_post: 3,
          recycle_interval_days: 90,
          frequency: 'weekly',
          posts_per_cycle: 3,
          allowed_platforms: ['linkedin', 'twitter', 'instagram', 'facebook']
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newSettings;
    }

    if (error) throw error;
    return settings;

  } catch (error) {
    console.error('❌ Error getting recycling settings:', error);
    throw error;
  }
}

/**
 * Update user's recycling settings
 */
async function updateRecyclingSettings(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('content_recycling_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Updated recycling settings for user ${userId}`);
    return data;

  } catch (error) {
    console.error('❌ Error updating recycling settings:', error);
    throw error;
  }
}

/**
 * Get recyclable posts for a user based on their settings
 */
async function getRecyclablePosts(userId, limit = 10) {
  try {
    // Get user settings
    const settings = await getRecyclingSettings(userId);

    console.log(`\n🔄 Finding recyclable posts for user ${userId}...`);
    console.log(`   Settings: ${settings.minimum_age_days}+ days old, ${settings.minimum_success_rate}% success rate`);

    // Query recyclable posts using the view
    const { data: posts, error } = await supabase
      .from('recyclable_posts')
      .select('*')
      .eq('user_id', userId)
      .gte('success_rate', settings.minimum_success_rate)
      .gte('days_since_last_recycle', settings.minimum_age_days)
      .lt('times_recycled', settings.max_recycles_per_post)
      .order('success_rate', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Filter by allowed platforms
    const filtered = posts.filter(post => {
      const postPlatforms = Array.isArray(post.platforms) ? post.platforms : [post.platforms];
      return postPlatforms.some(p => settings.allowed_platforms.includes(p));
    });

    console.log(`✅ Found ${filtered.length} recyclable posts`);
    
    return {
      posts: filtered,
      settings
    };

  } catch (error) {
    console.error('❌ Error getting recyclable posts:', error);
    throw error;
  }
}

/**
 * Manually recycle a specific post
 */
async function recyclePost(userId, originalPostId, options = {}) {
  try {
    console.log(`\n♻️  Recycling post ${originalPostId} for user ${userId}...`);

    // Get the original post
    const { data: originalPost, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        post_analytics (
          platform,
          success
        )
      `)
      .eq('id', originalPostId)
      .eq('user_id', userId)
      .single();

    if (postError) throw postError;
    if (!originalPost) throw new Error('Post not found');

    // Calculate original success rate
    const analytics = originalPost.post_analytics || [];
    const successRate = analytics.length > 0
      ? (analytics.filter(a => a.success).length / analytics.length) * 100
      : 0;

    // Determine platforms to recycle on
    const platforms = options.platforms || originalPost.platforms;
    
    // Schedule the recycled post
    const scheduleTime = options.scheduleTime || new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now by default

    const { data: recycledPost, error: scheduleError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        text: originalPost.text,
        platforms: Array.isArray(platforms) ? platforms : [platforms],
        image_url: originalPost.image_url,
        status: 'queued',
        schedule_time: scheduleTime.toISOString(),
        reddit_title: originalPost.reddit_title,
        reddit_subreddit: originalPost.reddit_subreddit
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // Record in recycling history
    const { error: historyError } = await supabase
      .from('content_recycling_history')
      .insert({
        user_id: userId,
        original_post_id: originalPostId,
        original_posted_at: originalPost.posted_at,
        original_success_rate: successRate,
        recycled_post_id: recycledPost.id,
        recycled_at: new Date().toISOString(),
        recycled_platforms: Array.isArray(platforms) ? platforms : [platforms],
        trigger_type: options.triggerType || 'manual'
      });

    if (historyError) throw historyError;

    console.log(`✅ Post recycled successfully!`);
    console.log(`   Original: ${originalPostId}`);
    console.log(`   Recycled: ${recycledPost.id}`);
    console.log(`   Scheduled for: ${scheduleTime.toISOString()}`);

    return {
      success: true,
      originalPost,
      recycledPost,
      scheduledFor: scheduleTime
    };

  } catch (error) {
    console.error('❌ Error recycling post:', error);
    throw error;
  }
}

/**
 * Automatically recycle posts based on user settings (for cron job)
 */
async function autoRecyclePosts(userId) {
  try {
    console.log(`\n🤖 AUTO-RECYCLE: Starting for user ${userId}...`);

    // Get settings
    const settings = await getRecyclingSettings(userId);

    if (!settings.auto_recycle_enabled) {
      console.log(`⏸️  Auto-recycle disabled for user ${userId}`);
      return { success: false, message: 'Auto-recycle is disabled' };
    }

    // Get recyclable posts
    const { posts } = await getRecyclablePosts(userId, settings.posts_per_cycle * 2); // Get 2x to have options

    if (posts.length === 0) {
      console.log(`⚠️  No recyclable posts found for user ${userId}`);
      return { success: false, message: 'No recyclable posts available' };
    }

    // Select top N posts to recycle
    const postsToRecycle = posts.slice(0, settings.posts_per_cycle);

    console.log(`📝 Recycling ${postsToRecycle.length} posts automatically...`);

    const recycled = [];
    const errors = [];

    for (let i = 0; i < postsToRecycle.length; i++) {
      const post = postsToRecycle[i];
      
      try {
        // Schedule each post at different times (spread throughout the week)
        const daysDelay = i * Math.floor(7 / postsToRecycle.length); // Spread across week
        const hoursDelay = Math.floor(Math.random() * 4) + 9; // Random time between 9 AM - 1 PM
        const scheduleTime = new Date();
        scheduleTime.setDate(scheduleTime.getDate() + daysDelay);
        scheduleTime.setHours(hoursDelay, 0, 0, 0);

        const result = await recyclePost(userId, post.id, {
          platforms: post.platforms,
          scheduleTime,
          triggerType: 'automatic'
        });

        recycled.push(result);
        console.log(`   ✅ [${i + 1}/${postsToRecycle.length}] Recycled post ${post.id}`);

      } catch (error) {
        console.error(`   ❌ [${i + 1}/${postsToRecycle.length}] Failed to recycle post ${post.id}:`, error.message);
        errors.push({ postId: post.id, error: error.message });
      }
    }

    console.log(`\n🎉 AUTO-RECYCLE COMPLETE:`);
    console.log(`   ✅ Success: ${recycled.length}/${postsToRecycle.length}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    return {
      success: true,
      recycledCount: recycled.length,
      errorCount: errors.length,
      recycled,
      errors
    };

  } catch (error) {
    console.error('❌ Error in auto-recycle:', error);
    throw error;
  }
}

/**
 * Get recycling history for a user
 */
async function getRecyclingHistory(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('content_recycling_history')
      .select(`
        *,
        original_post:posts!content_recycling_history_original_post_id_fkey (
          id,
          text,
          platforms,
          posted_at,
          image_url
        ),
        recycled_post:posts!content_recycling_history_recycled_post_id_fkey (
          id,
          scheduled_for,
          status
        )
      `)
      .eq('user_id', userId)
      .order('recycled_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting recycling history:', error);
    throw error;
  }
}

/**
 * Get recycling statistics for dashboard
 */
async function getRecyclingStats(userId) {
  try {
    // Total recycled posts
    const { count: totalRecycled, error: countError } = await supabase
      .from('content_recycling_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // Recent recycling (last 30 days)
    const { count: recentRecycled, error: recentError } = await supabase
      .from('content_recycling_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('recycled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (recentError) throw recentError;

    // Get available recyclable posts count
    const { posts } = await getRecyclablePosts(userId, 100);
    const availableCount = posts.length;

    // Get settings
    const settings = await getRecyclingSettings(userId);

    return {
      totalRecycled: totalRecycled || 0,
      recentRecycled: recentRecycled || 0,
      availableToRecycle: availableCount,
      autoRecycleEnabled: settings.auto_recycle_enabled,
      frequency: settings.frequency,
      postsPerCycle: settings.posts_per_cycle
    };

  } catch (error) {
    console.error('❌ Error getting recycling stats:', error);
    throw error;
  }
}

/**
 * Run auto-recycle for all users who have it enabled (for cron job)
 */
async function runAutoRecycleForAllUsers() {
  try {
    console.log('\n🌍 RUNNING AUTO-RECYCLE FOR ALL USERS...');
    console.log('='.repeat(60));

    // Get all users with auto-recycle enabled
    const { data: enabledUsers, error } = await supabase
      .from('content_recycling_settings')
      .select('user_id, frequency')
      .eq('auto_recycle_enabled', true);

    if (error) throw error;

    if (!enabledUsers || enabledUsers.length === 0) {
      console.log('⚠️  No users have auto-recycle enabled');
      return { success: true, processedUsers: 0 };
    }

    console.log(`📋 Found ${enabledUsers.length} users with auto-recycle enabled`);

    const results = [];

    for (const user of enabledUsers) {
      try {
        console.log(`\n👤 Processing user ${user.user_id}...`);
        const result = await autoRecyclePosts(user.user_id);
        results.push({ userId: user.user_id, ...result });
      } catch (error) {
        console.error(`❌ Failed for user ${user.user_id}:`, error.message);
        results.push({ userId: user.user_id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎉 AUTO-RECYCLE BATCH COMPLETE:`);
    console.log(`   ✅ Successful: ${successCount}/${enabledUsers.length} users`);
    console.log('='.repeat(60));

    return {
      success: true,
      processedUsers: enabledUsers.length,
      successfulUsers: successCount,
      results
    };

  } catch (error) {
    console.error('❌ Error running auto-recycle batch:', error);
    throw error;
  }
}

module.exports = {
  getRecyclingSettings,
  updateRecyclingSettings,
  getRecyclablePosts,
  recyclePost,
  autoRecyclePosts,
  getRecyclingHistory,
  getRecyclingStats,
  runAutoRecycleForAllUsers
};

