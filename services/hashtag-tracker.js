/**
 * Hashtag Performance Tracker
 * Extract, track, and analyze hashtag performance
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extract hashtags from text
 */
function extractHashtags(text) {
  if (!text) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = text.matchAll(hashtagRegex);
  const hashtags = [];
  
  for (const match of matches) {
    const hashtag = match[1].toLowerCase();
    if (hashtag && !hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
  }
  
  return hashtags;
}

/**
 * Track hashtags from a post
 */
async function trackHashtagsFromPost(userId, postId, text, platforms, success = true) {
  try {
    const hashtags = extractHashtags(text);
    
    if (hashtags.length === 0) {
      return { tracked: 0 };
    }

    console.log(`\n🏷️ Tracking ${hashtags.length} hashtags from post ${postId}...`);

    const platformArray = Array.isArray(platforms) ? platforms : [platforms];

    for (const platform of platformArray) {
      for (const hashtag of hashtags) {
        try {
          // Record post-hashtag relationship
          await supabase
            .from('post_hashtags')
            .insert({
              post_id: postId,
              user_id: userId,
              hashtag,
              platform
            })
            .onConflict(['post_id', 'hashtag', 'platform'])
            .ignoreDuplicates();

          // Update or create hashtag performance record
          const { data: existing, error: fetchError } = await supabase
            .from('hashtag_performance')
            .select('*')
            .eq('user_id', userId)
            .eq('hashtag', hashtag)
            .eq('platform', platform)
            .single();

          if (existing) {
            // Update existing record
            const newSuccessful = success ? existing.successful_posts + 1 : existing.successful_posts;
            const newFailed = success ? existing.failed_posts : existing.failed_posts + 1;
            const newTotal = existing.total_posts + 1;
            const newSuccessRate = (newSuccessful / newTotal) * 100;

            await supabase
              .from('hashtag_performance')
              .update({
                times_used: existing.times_used + 1,
                last_used_at: new Date().toISOString(),
                total_posts: newTotal,
                successful_posts: newSuccessful,
                failed_posts: newFailed,
                success_rate: newSuccessRate.toFixed(2)
              })
              .eq('id', existing.id);

          } else {
            // Create new record
            await supabase
              .from('hashtag_performance')
              .insert({
                user_id: userId,
                hashtag,
                platform,
                times_used: 1,
                total_posts: 1,
                successful_posts: success ? 1 : 0,
                failed_posts: success ? 0 : 1,
                success_rate: success ? 100 : 0
              });
          }

        } catch (error) {
          console.error(`Error tracking hashtag ${hashtag}:`, error.message);
        }
      }
    }

    console.log(`✅ Tracked ${hashtags.length} hashtags`);

    return {
      tracked: hashtags.length,
      hashtags
    };

  } catch (error) {
    console.error('❌ Error tracking hashtags:', error);
    return { tracked: 0, error: error.message };
  }
}

/**
 * Update hashtag engagement metrics
 */
async function updateHashtagEngagement(userId, postId, platform, engagement = {}) {
  try {
    // Get hashtags for this post
    const { data: postHashtags, error: fetchError } = await supabase
      .from('post_hashtags')
      .select('hashtag')
      .eq('post_id', postId)
      .eq('platform', platform);

    if (fetchError || !postHashtags || postHashtags.length === 0) {
      return;
    }

    const hashtags = postHashtags.map(ph => ph.hashtag);
    const engagementPerHashtag = Math.floor(
      (engagement.likes + engagement.comments + engagement.shares) / hashtags.length
    );

    for (const hashtag of hashtags) {
      const { data: existing, error } = await supabase
        .from('hashtag_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('hashtag', hashtag)
        .eq('platform', platform)
        .single();

      if (!existing) continue;

      const newTotalEngagement = existing.total_engagement + engagementPerHashtag;
      const newAvgEngagement = newTotalEngagement / existing.times_used;

      await supabase
        .from('hashtag_performance')
        .update({
          total_likes: existing.total_likes + (engagement.likes || 0),
          total_comments: existing.total_comments + (engagement.comments || 0),
          total_shares: existing.total_shares + (engagement.shares || 0),
          total_engagement: newTotalEngagement,
          avg_engagement: newAvgEngagement.toFixed(2)
        })
        .eq('id', existing.id);
    }

    console.log(`✅ Updated engagement for ${hashtags.length} hashtags`);

  } catch (error) {
    console.error('❌ Error updating hashtag engagement:', error);
  }
}

/**
 * Get top performing hashtags
 */
async function getTopHashtags(userId, platform = null, limit = 20) {
  try {
    let query = supabase
      .from('top_hashtags')
      .select('*')
      .eq('user_id', userId)
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting top hashtags:', error);
    throw error;
  }
}

/**
 * Get worst performing hashtags
 */
async function getWorstHashtags(userId, platform = null, limit = 10) {
  try {
    let query = supabase
      .from('hashtag_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('times_used', 3) // Minimum 3 uses
      .order('success_rate', { ascending: true })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting worst hashtags:', error);
    throw error;
  }
}

/**
 * Get hashtag suggestions based on user's best performers
 */
async function getHashtagSuggestions(userId, platform, currentHashtags = []) {
  try {
    // Get user's top performing hashtags for this platform
    const { data: topHashtags, error } = await supabase
      .from('hashtag_performance')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .gte('success_rate', 70) // At least 70% success rate
      .gte('times_used', 2) // Used at least twice
      .order('avg_engagement', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Filter out hashtags already in current list
    const currentHashtagsLower = currentHashtags.map(h => h.replace('#', '').toLowerCase());
    const suggestions = (topHashtags || [])
      .filter(h => !currentHashtagsLower.includes(h.hashtag))
      .map(h => ({
        hashtag: '#' + h.hashtag,
        success_rate: h.success_rate,
        avg_engagement: h.avg_engagement,
        times_used: h.times_used
      }));

    return suggestions;

  } catch (error) {
    console.error('❌ Error getting hashtag suggestions:', error);
    return [];
  }
}

/**
 * Analyze hashtag trends (detect trending up/down)
 */
async function analyzeHashtagTrends(userId) {
  try {
    console.log(`\n📊 Analyzing hashtag trends for user ${userId}...`);

    const { data: hashtags, error } = await supabase
      .from('hashtag_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('times_used', 5); // Need at least 5 uses

    if (error) throw error;

    if (!hashtags || hashtags.length === 0) {
      return { analyzed: 0 };
    }

    let trendingUp = 0;
    let trendingDown = 0;

    for (const hashtag of hashtags) {
      // Get recent posts with this hashtag (last 30 days)
      const { data: recentPosts, error: postsError } = await supabase
        .from('post_hashtags')
        .select(`
          post_id,
          posts!inner (
            posted_at,
            post_analytics (success)
          )
        `)
        .eq('user_id', userId)
        .eq('hashtag', hashtag.hashtag)
        .eq('platform', hashtag.platform)
        .gte('posts.posted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('posts.posted_at', { ascending: false })
        .limit(10);

      if (postsError || !recentPosts || recentPosts.length < 3) continue;

      // Calculate recent success rate
      const recentSuccess = recentPosts.filter(p => 
        p.posts.post_analytics?.every(a => a.success)
      ).length;
      const recentSuccessRate = (recentSuccess / recentPosts.length) * 100;

      // Compare to overall success rate
      const isTrendingUp = recentSuccessRate > hashtag.success_rate + 10;
      const isTrendingDown = recentSuccessRate < hashtag.success_rate - 10;

      if (isTrendingUp || isTrendingDown) {
        await supabase
          .from('hashtag_performance')
          .update({
            trending_up: isTrendingUp,
            trending_down: isTrendingDown,
            last_trend_check_at: new Date().toISOString()
          })
          .eq('id', hashtag.id);

        if (isTrendingUp) trendingUp++;
        if (isTrendingDown) trendingDown++;
      }
    }

    console.log(`✅ Analyzed ${hashtags.length} hashtags: ${trendingUp} trending up, ${trendingDown} trending down`);

    return {
      analyzed: hashtags.length,
      trending_up: trendingUp,
      trending_down: trendingDown
    };

  } catch (error) {
    console.error('❌ Error analyzing hashtag trends:', error);
    return { analyzed: 0, error: error.message };
  }
}

/**
 * Get hashtag analytics summary
 */
async function getHashtagAnalytics(userId, platform = null) {
  try {
    let query = supabase
      .from('hashtag_performance')
      .select('*')
      .eq('user_id', userId)
      .order('avg_engagement', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hashtags = data || [];

    // Calculate summary stats
    const totalHashtags = hashtags.length;
    const avgSuccessRate = hashtags.length > 0
      ? hashtags.reduce((sum, h) => sum + parseFloat(h.success_rate), 0) / hashtags.length
      : 0;
    const topPerformer = hashtags[0];
    const worstPerformer = hashtags[hashtags.length - 1];

    return {
      totalHashtags,
      avgSuccessRate: avgSuccessRate.toFixed(1),
      topPerformer,
      worstPerformer,
      allHashtags: hashtags
    };

  } catch (error) {
    console.error('❌ Error getting hashtag analytics:', error);
    throw error;
  }
}

module.exports = {
  extractHashtags,
  trackHashtagsFromPost,
  updateHashtagEngagement,
  getTopHashtags,
  getWorstHashtags,
  getHashtagSuggestions,
  analyzeHashtagTrends,
  getHashtagAnalytics
};

