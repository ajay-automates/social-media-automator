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
      let result;
      
      switch(platform) {
        case 'linkedin':
          if (imageUrl) {
            result = await postImageToLinkedIn(
              text,
              imageUrl,
              credentials.linkedin.accessToken,
              credentials.linkedin.urn,
              credentials.linkedin.type
            );
          } else {
            result = await postTextToLinkedIn(
              text,
              credentials.linkedin.accessToken,
              credentials.linkedin.urn,
              credentials.linkedin.type
            );
          }
          break;
          
        case 'twitter':
          result = await postToTwitter(text, credentials.twitter, imageUrl);
          break;
          
        case 'instagram':
          result = await postToInstagram(
            text,
            imageUrl,
            credentials.instagram.accessToken,
            credentials.instagram.igUserId
          );
          break;
          
        case 'telegram':
          result = await sendToTelegram(
            credentials.telegram.botToken,
            credentials.telegram.chatId,
            text,
            imageUrl
          );
          break;
          
        default:
          result = { success: false, error: `Unknown platform: ${platform}` };
      }
      
      results[platform] = result;
    } catch (error) {
      console.error(`❌ Error posting to ${platform}:`, error.message);
      results[platform] = { success: false, error: error.message };
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
