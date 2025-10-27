const cron = require('node-cron');
const { postTextToLinkedIn, postImageToLinkedIn } = require('./linkedin');
const { postToTwitter } = require('./twitter');
const { postToInstagram } = require('./instagram');
const { sendToTelegram } = require('./telegram');
const { 
  addPost, 
  getDuePosts, 
  getAllQueuedPosts, 
  updatePostStatus, 
  deletePost,
  cleanupOldPosts
} = require('./database');

/**
 * Schedule a post for later
 */
async function schedulePost(text, imageUrl, platforms, scheduleTime, credentials, userId = null) {
  try {
    const post = await addPost({
      text,
      imageUrl,
      platforms,
      scheduleTime: new Date(scheduleTime),
      credentials,
      userId // Pass userId for multi-tenant
    });
    
    console.log(`   Caption: ${text.slice(0, 50)}...`);
    console.log(`   Platforms: ${platforms.join(', ')}`);
    console.log(`   Scheduled for: ${new Date(scheduleTime).toLocaleString()}\n`);
    
    return post;
  } catch (error) {
    console.error('❌ Error scheduling post:', error.message);
    throw error;
  }
}

/**
 * Post immediately to selected platforms
 */
async function postNow(text, imageUrl, platforms, credentials) {
  // Ensure platforms is always an array
  if (!Array.isArray(platforms)) {
    platforms = platforms ? [platforms] : ['linkedin'];
  }
  
  console.log(`\n🚀 Posting to: ${platforms.join(', ')}...\n`);
  
  const results = {};
  
  for (const platform of platforms) {
    try {
      const accountResults = [];
      
      switch(platform) {
        case 'linkedin':
          // Post to ALL LinkedIn accounts
          for (const linkedinCreds of credentials.linkedin) {
            const result = imageUrl 
              ? await postImageToLinkedIn(text, imageUrl, linkedinCreds.accessToken, linkedinCreds.urn, linkedinCreds.type)
              : await postTextToLinkedIn(text, linkedinCreds.accessToken, linkedinCreds.urn, linkedinCreds.type);
            accountResults.push(result);
          }
          // Aggregate results: success if ANY succeeded
          results[platform] = {
            success: accountResults.some(r => r.success),
            results: accountResults,
            accountCount: accountResults.length,
            successCount: accountResults.filter(r => r.success).length
          };
          break;
          
        case 'twitter':
          // Post to ALL Twitter accounts
          for (const twitterCreds of credentials.twitter) {
            const result = await postToTwitter(text, twitterCreds, imageUrl);
            accountResults.push(result);
          }
          // Aggregate results: success if ANY succeeded
          results[platform] = {
            success: accountResults.some(r => r.success),
            results: accountResults,
            accountCount: accountResults.length,
            successCount: accountResults.filter(r => r.success).length
          };
          break;
          
        case 'instagram':
          // Post to ALL Instagram accounts
          for (const instagramCreds of credentials.instagram) {
            const result = await postToInstagram(text, imageUrl, instagramCreds.accessToken, instagramCreds.igUserId);
            accountResults.push(result);
          }
          results[platform] = {
            success: accountResults.some(r => r.success),
            results: accountResults,
            accountCount: accountResults.length,
            successCount: accountResults.filter(r => r.success).length
          };
          break;
          
        case 'facebook':
          // Post to ALL Facebook Pages
          const { postToFacebookPage } = require('./facebook');
          for (const fbCreds of credentials.facebook) {
            try {
              const result = await postToFacebookPage(text, imageUrl, {
                pageId: fbCreds.pageId,
                accessToken: fbCreds.accessToken
              });
              accountResults.push({
                success: true,
                pageId: fbCreds.pageId,
                postId: result.postId,
                permalink: result.permalink
              });
            } catch (error) {
              accountResults.push({
                success: false,
                pageId: fbCreds.pageId,
                error: error.message
              });
            }
          }
          results[platform] = {
            success: accountResults.some(r => r.success),
            results: accountResults,
            accountCount: accountResults.length,
            successCount: accountResults.filter(r => r.success).length
          };
          break;
          
        case 'telegram':
          // Post to ALL Telegram accounts
          for (const telegramCreds of credentials.telegram) {
            const result = await sendToTelegram(telegramCreds.botToken, telegramCreds.chatId, text, imageUrl);
            accountResults.push(result);
          }
          results[platform] = {
            success: accountResults.some(r => r.success),
            results: accountResults,
            accountCount: accountResults.length,
            successCount: accountResults.filter(r => r.success).length
          };
          break;
          
        default:
          accountResults.push({ success: false, error: `Unknown platform: ${platform}` });
          results[platform] = {
            success: false,
            results: accountResults,
            accountCount: 0,
            successCount: 0
          };
      }
    } catch (error) {
      console.error(`❌ Error posting to ${platform}:`, error.message);
      results[platform] = { 
        success: false, 
        error: error.message,
        accountCount: 0,
        successCount: 0
      };
    }
  }
  
  return results;
}

/**
 * Start the queue processor (checks every minute for due posts)
 */
function startQueueProcessor() {
  console.log('⏰ Queue processor started - checking every minute');
  console.log('📊 Using Supabase database for persistent storage\n');
  
  cron.schedule('* * * * *', async () => {
    try {
      const duePosts = await getDuePosts();
      
      if (duePosts.length === 0) {
        return;
      }
      
      const now = new Date();
      console.log(`\n⏰ [${now.toLocaleTimeString()}] Found ${duePosts.length} post(s) to publish...\n`);
      
      for (const post of duePosts) {
        console.log(`🚀 Publishing post ID ${post.id} to: ${post.platforms.join(', ')}`);
        console.log(`   Text: ${post.text.slice(0, 60)}...`);
        
        // Re-construct credentials from environment (not stored in DB for security)
        const credentials = {
          linkedin: {
            accessToken: process.env.LINKEDIN_TOKEN,
            urn: process.env.LINKEDIN_URN,
            type: process.env.LINKEDIN_TYPE
          },
          twitter: {
            apiKey: process.env.TWITTER_API_KEY,
            apiSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET
          },
          instagram: {
            accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
            igUserId: process.env.INSTAGRAM_USER_ID
          }
        };
        
        const results = await postNow(
          post.text,
          post.image_url,
          post.platforms,
          credentials
        );
        
        let allSucceeded = true;
        let hasFailure = false;
        
        for (const [platform, result] of Object.entries(results)) {
          if (result.success) {
            console.log(`   ✅ ${platform}: SUCCESS`);
          } else {
            console.log(`   ❌ ${platform}: ${result.error}`);
            allSucceeded = false;
            hasFailure = true;
          }
        }
        
        // Determine final status
        let status;
        if (allSucceeded) {
          status = 'posted';
        } else if (hasFailure && Object.values(results).some(r => r.success)) {
          status = 'partial';
        } else {
          status = 'failed';
        }
        
        // Update post status in database
        await updatePostStatus(post.id, status, results);
        
        console.log(`${allSucceeded ? '✅' : '⚠️'} Post ID ${post.id} completed (${status})\n`);
      }
    } catch (error) {
      console.error('❌ Queue processor error:', error.message);
    }
  });
  
  // Cleanup old posts every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await cleanupOldPosts();
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  });
}

/**
 * Get all posts in queue (for display)
 */
async function getQueue() {
  try {
    const posts = await getAllQueuedPosts();
    
    return posts.map(post => ({
      id: post.id,
      text: post.text.slice(0, 100) + (post.text.length > 100 ? '...' : ''),
      platforms: post.platforms,
      hasImage: !!post.image_url,
      scheduleTime: post.schedule_time,
      status: post.status,
      createdAt: post.created_at,
      postedAt: post.posted_at,
      results: post.results
    }));
  } catch (error) {
    console.error('❌ Error getting queue:', error.message);
    return [];
  }
}

/**
 * Delete a post from queue
 */
async function deleteFromQueue(postId) {
  try {
    return await deletePost(postId);
  } catch (error) {
    console.error('❌ Error deleting post:', error.message);
    return false;
  }
}

module.exports = {
  schedulePost,
  postNow,
  startQueueProcessor,
  getQueue,
  deleteFromQueue
};
