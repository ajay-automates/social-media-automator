const cron = require('node-cron');
const { postToLinkedIn } = require('./linkedin');
const { postToTwitter } = require('./twitter');
const { getUserCredentialsForPosting } = require('./oauth');
const { updatePostStatus } = require('./database');
const cache = require('./cache');

const SUPPORTED_PLATFORMS = new Set(['linkedin', 'twitter']);

// Use shared Supabase admin client from database.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

let isProcessing = false;

// Start the scheduler
function startScheduler() {
  console.log('🚀 Queue processor started - checking every minute');

  // Run every minute - process due posts
  cron.schedule('* * * * *', async () => {
    if (isProcessing) return;

    try {
      isProcessing = true;
      await processDueQueue();
    } catch (error) {
      console.error('❌ Queue processor error:', error);
    } finally {
      isProcessing = false;
    }
  });

  // Run every Monday at 9 AM - send weekly email reports
  cron.schedule('0 9 * * 1', async () => {
    console.log('📧 Running weekly email reports job...');

    try {
      const { sendWeeklyReportsToAll } = require('./reports');
      const result = await sendWeeklyReportsToAll();
      console.log(`✅ Email reports sent: ${result.sent} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ Email reports job error:', error);
    }
  });

  console.log('📧 Email reports scheduler initialized (Mondays at 9 AM)');

}

async function processDueQueue() {
  try {
    // Get all posts that are due (including partial failures for retry)
    const { data: duePostsData, error: dueError } = await supabase
      .from('posts')
      .select('*')
      .in('status', ['queued', 'partial']) // Also retry partial failures
      .lte('schedule_time', new Date().toISOString())
      .limit(10);

    if (dueError) {
      console.error('Error fetching due posts:', dueError);
      return;
    }

    if (!duePostsData || duePostsData.length === 0) {
      return;
    }

    console.log(`📋 Processing ${duePostsData.length} due posts...`);

    for (const post of duePostsData) {
      console.log(`Processing post ${post.id}...`);

      // 1. Mark as processing to prevent double-pickup
      await supabase.from('posts').update({ status: 'processing' }).eq('id', post.id);

      // Filter out platforms that already succeeded (for partial retries)
      let platformsToPost = post.platforms;
      if (typeof platformsToPost === 'string') {
        platformsToPost = JSON.parse(platformsToPost);
      }

      if (post.status === 'partial' && post.results) {
        let previousResults = post.results;
        if (typeof previousResults === 'string') {
          try { previousResults = JSON.parse(previousResults); } catch (e) { }
        }

        if (previousResults) {
          // Identify successful platforms
          const successfulPlatforms = new Set();
          Object.entries(previousResults).forEach(([platform, result]) => {
            const resultsArray = Array.isArray(result) ? result : [result];
            // If ANY account for this platform succeeded, assume success for platform (simplification)
            // Or better: check if ALL accounts for this platform succeeded. 
            // For now, if any success is recorded for the platform, exclude it to avoid spam.
            if (resultsArray.some(r => r.success)) {
              successfulPlatforms.add(platform);
            }
          });

          if (successfulPlatforms.size > 0) {
            console.log(`⏭️  Skipping already successful platforms for post ${post.id}: ${Array.from(successfulPlatforms).join(', ')}`);
            platformsToPost = platformsToPost.filter(p => !successfulPlatforms.has(p));
          }
        }
      }

      if (platformsToPost.length === 0) {
        console.log(`✅ Post ${post.id} fully completed (all platforms previously success). Marking done.`);
        await updatePostStatus(post.id, 'posted', post.results);
        continue;
      }

      // Update the post object with the filtered platforms list for this run
      const postToRun = { ...post, platforms: platformsToPost };

      // 2. Execute posting
      const results = await postNow(postToRun);

      // 3. Determine final status
      // We need to merge new results with old results if this was a partial retry
      let finalResults = results;
      if (post.status === 'partial' && post.results) {
        // Merge logic could go here, but `updatePostStatus` might handle overwrite. 
        // For simplistic robustness, we will just send the new results.
        // Actually, to preserve history, we should merge.
        let oldResults = post.results;
        if (typeof oldResults === 'string') try { oldResults = JSON.parse(oldResults); } catch (e) { }
        finalResults = { ...oldResults, ...results };
      }

      let finalStatus = 'posted';
      let failureCount = 0;
      let successCount = 0;

      // Check ALL results (merged)
      if (finalResults && typeof finalResults === 'object') {
        Object.values(finalResults).forEach(platformResults => {
          if (Array.isArray(platformResults)) {
            platformResults.forEach(res => {
              if (res.success) successCount++;
              else failureCount++;
            });
          }
        });
      }

      if (successCount === 0 && failureCount > 0) finalStatus = 'failed';
      else if (failureCount > 0) finalStatus = 'partial';

      // 4. Update database with final results
      await updatePostStatus(post.id, finalStatus, finalResults);
      console.log(`✅ Post ${post.id} completed. Status: ${finalStatus}`);
    }
  } catch (error) {
    console.error('❌ Error in processDueQueue:', error);
  }
}

async function postNow(text, imageUrl, platforms, providedCredentials, post_metadata, useVariations = false, videoUrl = null) {
  try {
    console.log('📹 postNow called with video:', videoUrl ? 'YES' : 'NO');
    let id, user_id, image_url, platformsArray, credentials, variationsData;

    // Support both signatures:
    // 1. postNow({id, user_id, text, image_url, platforms}) - for scheduled posts
    // 2. postNow(text, imageUrl, platforms, credentials, post_metadata, useVariations) - for immediate posts
    if (typeof text === 'object' && text.text) {
      ({ id, user_id, text, image_url, platforms } = text);
      platformsArray = Array.isArray(platforms) ? platforms : JSON.parse(platforms || '[]');
      credentials = await getUserCredentialsForPosting(user_id);
    } else if (typeof text === 'object' && !text.text) {
      variationsData = text;
      platformsArray = platforms || [];
      image_url = videoUrl || imageUrl;
      credentials = providedCredentials;
      user_id = 'immediate';
    } else {
      platformsArray = platforms || [];
      image_url = videoUrl || imageUrl;
      credentials = providedCredentials;
      user_id = 'immediate';
    }

    platformsArray = platformsArray.filter(platform => SUPPORTED_PLATFORMS.has(platform));

    console.log('\n📤 Posting to: ' + (platformsArray.join(', ') || 'none'));
    if (variationsData) {
      console.log('🎨 Using platform-specific variations');
    }
    if (videoUrl) {
      console.log('📹 Attaching video: ' + videoUrl.substring(0, 50) + '...');
    } else if (imageUrl) {
      console.log('🖼️ Attaching image: ' + imageUrl.substring(0, 50) + '...');
    }

    if (!credentials) {
      console.error('❌ No credentials found');
      return {};
    }

    const results = {};

    for (const platform of platformsArray) {
      const platformText = variationsData && variationsData[platform] ? variationsData[platform] : text;
      console.log('  → Posting to ' + platform + '...');

      if (platform === 'linkedin') {
        results.linkedin = [];
        const accounts = Array.isArray(credentials.linkedin) ? credentials.linkedin : [];

        if (accounts.length === 0) {
          console.log('⚠️  No LinkedIn credentials found');
          results.linkedin.push({
            success: false,
            error: 'No LinkedIn account connected. Please connect your LinkedIn account in Settings.',
            platform: 'linkedin'
          });
          continue;
        }

        for (const account of accounts) {
          try {
            const result = await postToLinkedIn(platformText, image_url, account);
            results.linkedin.push({ platform: 'linkedin', ...result });
            console.log(result.success ? '    ✅ Posted to LinkedIn' : '    ❌ LinkedIn error: ' + result.error);
          } catch (err) {
            console.error('    ❌ LinkedIn error:', err.message);
            let errorMessage = err.message;
            if (err.response?.status === 401 || err.response?.status === 403) {
              errorMessage = 'LinkedIn access token is invalid or expired. Please reconnect your LinkedIn account in Settings.';
            } else if (err.response?.status === 429 || err.response?.data?.message?.includes('throttle')) {
              errorMessage = 'Daily LinkedIn posting limit reached. Please try again tomorrow.';
            } else if (err.response?.status === 400) {
              errorMessage = 'LinkedIn error: ' + (err.response?.data?.message || err.message);
            }
            results.linkedin.push({
              success: false,
              error: errorMessage,
              platform: 'linkedin',
              requiresReconnect: err.response?.status === 401 || err.response?.status === 403
            });
          }
        }
      }

      if (platform === 'twitter') {
        results.twitter = [];
        const accounts = Array.isArray(credentials.twitter) ? credentials.twitter : [];

        if (accounts.length === 0) {
          console.log('⚠️  No Twitter credentials found');
          results.twitter.push({
            success: false,
            error: 'No Twitter account connected. Please connect your Twitter account in Settings.',
            platform: 'twitter'
          });
          continue;
        }

        for (const account of accounts) {
          try {
            if (account.token_expires_at && new Date(account.token_expires_at) <= new Date()) {
              console.log('    🔄 Twitter token expired, refreshing...');
              const { refreshTwitterToken } = require('./twitter-auth');
              const refreshResult = await refreshTwitterToken(user_id, account.platform_user_id);

              if (!refreshResult.success) {
                results.twitter.push({
                  success: false,
                  error: 'Token expired and refresh failed. Please reconnect your Twitter account.',
                  platform: 'twitter',
                  requiresReconnect: true
                });
                continue;
              }

              account.accessToken = refreshResult.accessToken;
              account.bearerToken = refreshResult.accessToken;
            }

            const result = await postToTwitter(platformText, account, image_url);
            results.twitter.push({ platform: 'twitter', ...result });

            if (!result.success && (
              result.error?.toLowerCase().includes('token') ||
              result.error?.toLowerCase().includes('expired') ||
              result.error?.toLowerCase().includes('unauthorized') ||
              result.error?.includes('401')
            )) {
              console.log('    🔄 Twitter returned token error, attempting refresh...');
              const { refreshTwitterToken } = require('./twitter-auth');
              const refreshResult = await refreshTwitterToken(user_id, account.platform_user_id);

              if (refreshResult.success) {
                account.accessToken = refreshResult.accessToken;
                account.bearerToken = refreshResult.accessToken;
                const retryResult = await postToTwitter(platformText, account, image_url);
                results.twitter[results.twitter.length - 1] = { platform: 'twitter', ...retryResult };
              } else {
                results.twitter[results.twitter.length - 1] = {
                  success: false,
                  error: 'Token expired. Please reconnect your Twitter account in Settings.',
                  platform: 'twitter',
                  requiresReconnect: true
                };
              }
            }

            const latest = results.twitter[results.twitter.length - 1];
            console.log(latest.success ? '    ✅ Posted to Twitter successfully' : '    ❌ Twitter error: ' + latest.error);
          } catch (err) {
            console.error('    ❌ Twitter error:', err.message);
            results.twitter.push({
              success: false,
              error: err.response?.status === 401 ? 'Token expired. Please reconnect your Twitter account in Settings.' : err.message,
              platform: 'twitter',
              requiresReconnect: err.response?.status === 401
            });
          }
        }
      }
    }

    const hasErrors = Object.values(results).some(result => {
      const resultList = Array.isArray(result) ? result : [result];
      return resultList.some(item => item.success === false || item.error);
    });

    const hasSuccess = Object.values(results).some(result => {
      const resultList = Array.isArray(result) ? result : [result];
      return resultList.some(item => item.success === true);
    });

    let status = 'posted';
    if (hasErrors && hasSuccess) status = 'partial';
    if (hasErrors && !hasSuccess) status = 'failed';

    if (id) {
      await updatePostStatus(id, status, results);
      console.log('✅ Post [' + id + '] completed - Status: ' + status);

      if (user_id && user_id !== 'immediate') {
        cache.invalidateUserCacheByCategory(user_id, ['analytics', 'platform_stats']);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Error posting:', error);

    if (typeof text === 'object' && text.id) {
      await updatePostStatus(text.id, 'failed', { error: error.message });
      if (text.user_id && text.user_id !== 'immediate') {
        cache.invalidateUserCacheByCategory(text.user_id, ['analytics', 'platform_stats']);
      }
    }

    throw error;
  }
}

// Note: updatePostStatus is now imported from database.js to avoid duplication

async function schedulePost(postData) {
  try {
    const { user_id, text, image_url, platforms, schedule_time } = postData;

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          user_id,
          text,
          image_url,
          platforms: Array.isArray(platforms) ? platforms : [platforms],
          schedule_time: new Date(schedule_time).toISOString(),
          status: 'queued',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    // Invalidate cache to ensure dashboard stats update immediately
    if (user_id && data && data[0]) {
      const cache = require('./cache');
      cache.invalidateUserCacheByCategory(user_id, ['analytics', 'platform_stats', 'post_history']);
    }

    return { success: true, post: data[0] };
  } catch (error) {
    console.error('Error scheduling post:', error);
    return { success: false, error: error.message };
  }
}

async function getQueue(userId) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .order('schedule_time', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching queue:', error);
    return [];
  }
}

async function deleteFromQueue(postId, userId) {
  try {
    const { error, count } = await supabase.from('posts').delete({ count: 'exact' })
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true, count };
  } catch (error) {
    console.error('Error deleting from queue:', error);
    return { success: false, error: error.message };
  }
}

async function getAllQueuedPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'queued')
      .order('schedule_time', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all queued posts:', error);
    return [];
  }
}

module.exports = {
  startScheduler,
  postNow,
  schedulePost,
  getQueue,
  deleteFromQueue,
  getAllQueuedPosts,
  processDueQueue,
};
