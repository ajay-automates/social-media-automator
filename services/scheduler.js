const cron = require('node-cron');
const { postTextToLinkedIn, postImageToLinkedIn } = require('./linkedin');
const { postToTwitter } = require('./twitter');

let queue = [];
let postIdCounter = 1;

function addToQueue(post) {
  const queueItem = {
    id: postIdCounter++,
    ...post,
    status: 'queued',
    createdAt: new Date()
  };
  
  queue.push(queueItem);
  console.log(`\n✅ Added to queue (ID: ${queueItem.id})`);
  console.log(`   Caption: ${post.text.slice(0, 50)}...`);
  console.log(`   Platforms: ${post.platforms.join(', ')}`);
  console.log(`   Scheduled for: ${new Date(post.scheduleTime).toLocaleString()}\n`);
  
  return queueItem;
}

function schedulePost(text, imageUrl, platforms, scheduleTime, credentials) {
  const post = {
    text,
    imageUrl,
    platforms,
    scheduleTime: new Date(scheduleTime),
    credentials
  };
  
  return addToQueue(post);
}

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
          result = await postToTwitter(text, credentials.twitter);
          break;
      }
      
      results[platform] = result;
    } catch (error) {
      console.error(`❌ Error posting to ${platform}:`, error.message);
      results[platform] = { success: false, error: error.message };
    }
  }
  
  return results;
}

function startQueueProcessor() {
  console.log('⏰ Queue processor started - checking every minute\n');
  
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    
    const duePosts = queue.filter(
      post => post.status === 'queued' && post.scheduleTime <= now
    );
    
    if (duePosts.length === 0) {
      return;
    }
    
    console.log(`\n⏰ [${now.toLocaleTimeString()}] Found ${duePosts.length} post(s) to publish...\n`);
    
    for (const post of duePosts) {
      console.log(`🚀 Publishing post ID ${post.id} to: ${post.platforms.join(', ')}`);
      console.log(`   Text: ${post.text.slice(0, 60)}...`);
      
      const results = await postNow(
        post.text,
        post.imageUrl,
        post.platforms,
        post.credentials
      );
      
      let allSucceeded = true;
      for (const [platform, result] of Object.entries(results)) {
        if (result.success) {
          console.log(`   ✅ ${platform}: SUCCESS`);
        } else {
          console.log(`   ❌ ${platform}: ${result.error}`);
          allSucceeded = false;
        }
      }
      
      const queueItem = queue.find(p => p.id === post.id);
      if (queueItem) {
        queueItem.status = allSucceeded ? 'posted' : 'partial';
        queueItem.postedAt = new Date();
        queueItem.results = results;
      }
      
      console.log(`${allSucceeded ? '✅' : '⚠️'} Post ID ${post.id} completed\n`);
    }
  });
}

function getQueue() {
  return queue.map(post => ({
    id: post.id,
    text: post.text.slice(0, 100) + (post.text.length > 100 ? '...' : ''),
    platforms: post.platforms,
    hasImage: !!post.imageUrl,
    scheduleTime: post.scheduleTime,
    status: post.status,
    createdAt: post.createdAt,
    postedAt: post.postedAt
  }));
}

function deleteFromQueue(postId) {
  const index = queue.findIndex(p => p.id === postId);
  if (index !== -1) {
    queue.splice(index, 1);
    return true;
  }
  return false;
}

function cleanupQueue() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const initialLength = queue.length;
  
  queue = queue.filter(post => {
    if (post.status === 'queued') return true;
    if (post.postedAt && post.postedAt > oneDayAgo) return true;
    return false;
  });
  
  const removed = initialLength - queue.length;
  if (removed > 0) {
    console.log(`🧹 Cleaned up ${removed} old post(s) from queue`);
  }
}

cron.schedule('0 * * * *', cleanupQueue);

module.exports = {
  schedulePost,
  postNow,
  startQueueProcessor,
  getQueue,
  deleteFromQueue
};
