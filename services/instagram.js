const axios = require('axios');

/**
 * Poll container status until it's ready
 */
async function pollContainerStatus(containerId, accessToken, maxAttempts = 10, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${containerId}`,
        {
          params: {
            fields: 'status_code',
            access_token: accessToken
          }
        }
      );
      
      const status = response.data.status_code;
      console.log(`   📊 Container status: ${status} (attempt ${i + 1}/${maxAttempts})`);
      
      if (status === 'FINISHED') {
        return true;
      }
      
      if (status === 'ERROR') {
        throw new Error('Container processing failed with ERROR status');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`   ⚠️ Error polling status:`, error.message);
      if (i === maxAttempts - 1) throw error;
    }
  }
  
  throw new Error('Container processing timeout - status never reached FINISHED');
}

/**
 * Post to Instagram (supports images and Reels)
 * @param {string} caption - Post caption
 * @param {string} mediaUrl - Public URL to image or video
 * @param {string} accessToken - Instagram access token
 * @param {string} igUserId - Instagram user ID
 */
async function postToInstagram(caption, mediaUrl, accessToken, igUserId) {
  try {
    if (!mediaUrl) {
      return {
        success: false,
        error: 'Instagram requires a media URL (image or video)',
        platform: 'instagram'
      };
    }
    
    // Determine media type (video for Reels, image otherwise)
    const isVideo = /\.(mp4|mov|avi)$/i.test(mediaUrl);
    const mediaType = isVideo ? 'REELS' : 'IMAGE';
    
    console.log(`   📸 Creating ${mediaType} container...`);
    
    // Step 1: Create media container
    const containerParams = {
      access_token: accessToken,
      caption: caption
    };
    
    if (isVideo) {
      containerParams.media_type = 'REELS';
      containerParams.video_url = mediaUrl;
    } else {
      containerParams.image_url = mediaUrl;
    }
    
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      null,
      { params: containerParams }
    );
    
    const containerId = containerResponse.data.id;
    console.log(`   ✅ Container created: ${containerId}`);
    
    // Step 2: Poll until container is ready (required for videos)
    if (isVideo) {
      console.log(`   ⏳ Waiting for video processing...`);
      await pollContainerStatus(containerId, accessToken);
    } else {
      // For images, wait a brief moment
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Publish the container
    console.log(`   📤 Publishing to Instagram...`);
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: accessToken
        }
      }
    );
    
    console.log('✅ Instagram: Posted successfully');
    console.log('   Post ID:', publishResponse.data.id);
    
    return {
      success: true,
      id: publishResponse.data.id,
      platform: 'instagram',
      mediaType: mediaType
    };
  } catch (error) {
    console.error('❌ Instagram error:', error.response?.data || error.message);
    
    let errorMessage = error.message;
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.response?.data,
      platform: 'instagram'
    };
  }
}

module.exports = {
  postToInstagram
};

