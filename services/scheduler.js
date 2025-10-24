const cron = require('node-cron');
const { postTextToLinkedIn, postImageToLinkedIn } = require('./linkedin');

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
  console.log(`   Scheduled for: ${new Date(post.scheduleTime).toLocaleString()}\n`);
  
  return queueItem;
}

function schedulePost(text, imageUrl, scheduleTime, credentials) {
  const post = {
    text,
    imageUrl,
    scheduleTime: new Date(scheduleTime),
    credentials
  };
  
  return addToQueue(post);
}

async function postNow(text, imageUrl, credentials) {
  console.log('\n🚀 Posting immediately to LinkedIn...');
  console.log('Credentials:', {
    hasToken: !!credentials.linkedin.accessToken,
    urn: credentials.linkedin.urn,
    type: credentials.linkedin.type
  });
  
  try {
    let result;
    
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
    
    return result;
  } catch (error) {
    console.error('❌ Error posting now:', error.message);
    return { success: false, error: error.message };
  }
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
      console.log(`🚀 Publishing post ID ${post.id}...`);
      console.log(`   Text: ${post.text.slice(0, 60)}...`);
      
      try {
        let result;
        
        if (post.imageUrl) {
          result = await postImageToLinkedIn(
            post.text,
            post.imageUrl,
            post.credentials.linkedin.accessToken,
            post.credentials.linkedin.urn,
            post.credentials.linkedin.type
          );
        } else {
          result = await postTextToLinkedIn(
            post.text,
            post.credentials.linkedin.accessToken,
            post.credentials.linkedin.urn,
            post.credentials.linkedin.type
          );
        }
        
        if (result.success) {
          const queueItem = queue.find(p => p.id === post.id);
          if (queueItem) {
            queueItem.status = 'posted';
            queueItem.postedAt = new Date();
            queueItem.platformPostId = result.id;
          }
          
          console.log(`✅ Post ID ${post.id} published successfully!\n`);
        } else {
          const queueItem = queue.find(p => p.id === post.id);
          if (queueItem) {
            queueItem.status = 'failed';
            queueItem.error = result.error;
          }
          
          console.log(`❌ Post ID ${post.id} failed: ${result.error}\n`);
        }
      } catch (error) {
        console.error(`❌ Error publishing post ID ${post.id}:`, error.message);
        
        const queueItem = queue.find(p => p.id === post.id);
        if (queueItem) {
          queueItem.status = 'failed';
          queueItem.error = error.message;
        }
      }
    }
  });
}

function getQueue() {
  return queue.map(post => ({
    id: post.id,
    text: post.text.slice(0, 100) + (post.text.length > 100 ? '...' : ''),
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
