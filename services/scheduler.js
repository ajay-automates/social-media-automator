const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { postTextToLinkedIn, postImageToLinkedIn } = require('./linkedin');
const { postToTwitter } = require('./twitter');
const { sendToTelegram } = require('./telegram');
const { postToInstagram } = require('./instagram');
const { postToFacebookPage } = require('./facebook');
const { postToYouTube } = require('./youtube');
const { getUserCredentialsForPosting } = require('./oauth');

const supabase = createClient(
  process.env.SUPABASE_URL?.trim() || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY
);

let isProcessing = false;

// Start the scheduler
function startScheduler() {
  console.log('🚀 Queue processor started - checking every minute');
  
  // Run every minute
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
}

async function processDueQueue() {
  try {
    // Get all posts that are due
    const { data: duePostsData, error: dueError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'queued')
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
      await postNow(post);
    }
  } catch (error) {
    console.error('❌ Error in processDueQueue:', error);
  }
}

async function postNow(text, imageUrl, platforms, providedCredentials) {
  try {
    let id, user_id, image_url, platformsArray, credentials;
    
    // Support both signatures:
    // 1. postNow({id, user_id, text, image_url, platforms}) - for scheduled posts
    // 2. postNow(text, imageUrl, platforms, credentials) - for immediate posts
    if (typeof text === 'object' && text.text) {
      // Signature 1: Scheduled post object
      ({ id, user_id, text, image_url, platforms } = text);
      platformsArray = platforms;
      if (typeof platforms === 'string') {
        platformsArray = JSON.parse(platforms);
      }
      // Get credentials from database
      credentials = await getUserCredentialsForPosting(user_id);
    } else {
      // Signature 2: Immediate post (OLD signature)
      platformsArray = platforms;
      image_url = imageUrl;
      credentials = providedCredentials;
      user_id = 'immediate';
    }

    console.log(`\n📤 Posting to: ${platformsArray.join(', ')}`);
    
    if (!credentials) {
      console.error(`❌ No credentials found`);
      return {};
    }

    const results = {};

    // Process each platform
    for (const platform of platformsArray) {
      try {
        console.log(`  → Posting to ${platform}...`);

        if (platform === 'linkedin') {
          // LinkedIn - post to all connected accounts
          if (credentials.linkedin && Array.isArray(credentials.linkedin)) {
            for (const account of credentials.linkedin) {
              try {
                let result;
                if (image_url) {
                  result = await postImageToLinkedIn(text, image_url, account.accessToken, account.urn, account.type);
                } else {
                  result = await postTextToLinkedIn(text, account.accessToken, account.urn, account.type);
                }
                results.linkedin = results.linkedin || [];
                results.linkedin.push(result);
                console.log(`    ✅ Posted to LinkedIn`);
              } catch (err) {
                console.error(`    ❌ LinkedIn error:`, err.message);
                results.linkedin = results.linkedin || [];
                results.linkedin.push({ error: err.message });
              }
            }
          }
        } 
        else if (platform === 'twitter') {
          // Twitter - post to all connected accounts
          if (credentials.twitter && Array.isArray(credentials.twitter)) {
            console.log(`🐦 Twitter credentials found:`, credentials.twitter.length, 'accounts');
            for (const account of credentials.twitter) {
              console.log(`🐦 Posting to Twitter with account:`, JSON.stringify(account, null, 2));
              try {
                const result = await postToTwitter(text, account, image_url);
                results.twitter = results.twitter || [];
                results.twitter.push(result);
                console.log(`    ✅ Posted to Twitter - Result:`, JSON.stringify(result, null, 2));
              } catch (err) {
                console.error(`    ❌ Twitter error:`, err.message);
                results.twitter = results.twitter || [];
                results.twitter.push({ error: err.message });
              }
            }
          } else {
            console.log(`⚠️  No Twitter credentials found`);
          }
        } 
        else if (platform === 'telegram') {
          // Telegram - post to all connected bots
          if (credentials.telegram && Array.isArray(credentials.telegram) && credentials.telegram.length > 0) {
            results.telegram = [];
            for (const account of credentials.telegram) {
              try {
                // Note: getUserCredentialsForPosting returns { botToken, chatId }
                console.log(`    📱 Posting to Telegram - Bot token: ${account.botToken ? 'exists' : 'missing'}, Chat ID: ${account.chatId}`);
                const result = await sendToTelegram(account.botToken, account.chatId, text, image_url);
                results.telegram.push(result);
                console.log(`    ✅ Posted to Telegram - Result:`, JSON.stringify(result, null, 2));
              } catch (err) {
                console.error(`    ❌ Telegram error:`, err.message);
                results.telegram.push({ error: err.message, platform: 'telegram' });
              }
            }
          } else {
            console.log(`⚠️  No Telegram credentials found or invalid format`);
            console.log(`⚠️  Credentials structure:`, JSON.stringify(credentials.telegram, null, 2));
          }
        } 
        else if (platform === 'instagram') {
          // ✅ FIXED: Use database credentials instead of process.env
          if (credentials.instagram && Array.isArray(credentials.instagram)) {
            for (const account of credentials.instagram) {
              try {
                const result = await postToInstagram(text, image_url, account.access_token, account.platform_user_id);
                results.instagram = results.instagram || [];
                results.instagram.push(result);
                console.log(`    ✅ Posted to Instagram (${account.platform_username})`);
              } catch (err) {
                console.error(`    ❌ Instagram error:`, err.message);
                results.instagram = results.instagram || [];
                results.instagram.push({ error: err.message });
              }
            }
          }
        } 
        else if (platform === 'facebook') {
          // ✅ FIXED: Use database credentials instead of process.env
          if (credentials.facebook && Array.isArray(credentials.facebook)) {
            for (const account of credentials.facebook) {
              try {
                const result = await postToFacebookPage(text, image_url, {
                  pageId: account.platform_user_id,
                  accessToken: account.access_token
                });
                results.facebook = results.facebook || [];
                results.facebook.push(result);
                console.log(`    ✅ Posted to Facebook (${account.platform_username})`);
              } catch (err) {
                console.error(`    ❌ Facebook error:`, err.message);
                results.facebook = results.facebook || [];
                results.facebook.push({ error: err.message });
              }
            }
          }
        }
        else if (platform === 'youtube') {
          if (credentials.youtube && Array.isArray(credentials.youtube)) {
            results.youtube = [];
            for (const account of credentials.youtube) {
              try {
                // Only post if we have a video URL
                const videoUrl = image_url && image_url.includes('/video/') ? image_url : null;
                
                if (!videoUrl) {
                  console.log(`    ⚠️  Skipping YouTube - no video URL provided`);
                  results.youtube.push({
                    success: false,
                    error: 'YouTube requires a video URL (Shorts only). Community Posts not supported.',
                    platform: 'youtube'
                  });
                  continue;
                }
                
                const content = {
                  text: text,
                  videoUrl: videoUrl,
                  imageUrl: null,
                  title: text.substring(0, 100),
                  description: text.substring(0, 5000),
                  tags: [],
                  type: 'short'
                };
                
                // Match the format that youtube.js expects
                const ytCredentials = {
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token
                };
                
                const result = await postToYouTube(content, ytCredentials);
                results.youtube.push(result);
                
                if (result.success) {
                  console.log(`    ✅ Posted to YouTube (${account.platform_user_id})`);
                } else {
                  console.log(`    ❌ YouTube error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ YouTube error:`, err.message);
                results.youtube.push({
                  success: false,
                  error: err.message,
                  platform: 'youtube'
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Platform ${platform} error:`, error);
        results[platform] = { error: error.message };
      }
    }

    // Check if all platforms succeeded
    const hasErrors = Object.values(results).some(r => {
      if (Array.isArray(r)) return r.some(item => item.error);
      return r.error;
    });

    const status = hasErrors ? 'failed' : 'posted';
    const message = JSON.stringify(results);

    // Only update post status if this is a scheduled post (has id)
    if (id) {
      await updatePostStatus(id, status, message);
      console.log(`✅ Post [${id}] completed - Status: ${status}`);
    }
    
    // Return results for immediate posting
    return results;

  } catch (error) {
    console.error(`❌ Error posting:`, error);
    
    // Only update post status if this is a scheduled post (has id)
    if (id) {
      await updatePostStatus(id, 'failed', error.message);
    }
    
    throw error; // Re-throw for immediate posts
  }
}

async function updatePostStatus(postId, status, message = null) {
  try {
    const update = { status, updated_at: new Date().toISOString() };
    if (message) update.result = message;

    const { error } = await supabase
      .from('posts')
      .update(update)
      .eq('id', postId);

    if (error) {
      console.error('Error updating post status:', error);
    }
  } catch (error) {
    console.error('Error in updatePostStatus:', error);
  }
}

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
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
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