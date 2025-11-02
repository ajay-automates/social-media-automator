/**
 * Discord Service
 * Handle posting to Discord using incoming webhooks
 * 
 * NO OAuth - users provide their own webhook URL from Discord
 */

const axios = require('axios');

/**
 * Validate a Discord webhook URL
 * @param {string} webhookUrl - Webhook URL from Discord
 * @returns {Promise<object>} Validation result
 */
async function validateWebhook(webhookUrl) {
  try {
    // Check URL format
    if (!webhookUrl || 
        (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && 
         !webhookUrl.startsWith('https://discordapp.com/api/webhooks/'))) {
      return {
        valid: false,
        error: 'Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/ or https://discordapp.com/api/webhooks/'
      };
    }
    
    // Test webhook with a simple message
    const testPayload = {
      content: '✅ Discord webhook connected successfully! You can now post to this channel from Social Media Automator.'
    };
    
    const response = await axios.post(webhookUrl, testPayload, {
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Accept 2xx status codes
      }
    });
    
    // Discord returns 204 No Content on success
    if (response.status === 204 || response.status === 200) {
      console.log('✅ Discord webhook validated successfully');
      return {
        valid: true,
        message: 'Webhook validated successfully'
      };
    }
    
    return {
      valid: false,
      error: 'Webhook validation failed'
    };
  } catch (error) {
    console.error('Discord webhook validation error:', error.response?.data || error.message);
    return {
      valid: false,
      error: error.response?.data?.message || error.message || 'Invalid webhook URL'
    };
  }
}

/**
 * Send a text message to Discord
 * @param {string} webhookUrl - Webhook URL
 * @param {string} text - Message text
 * @returns {Promise<object>} Result
 */
async function sendTextMessage(webhookUrl, text) {
  try {
    const payload = {
      content: text
    };
    
    const response = await axios.post(webhookUrl, payload);
    
    if (response.status === 204 || response.status === 200) {
      console.log('✅ Discord: Text posted successfully');
      return {
        success: true,
        platform: 'discord',
        message: 'Posted to Discord successfully'
      };
    }
    
    throw new Error('Discord API returned unexpected response');
  } catch (error) {
    console.error('❌ Discord text error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      platform: 'discord'
    };
  }
}

/**
 * Send a message with image to Discord
 * @param {string} webhookUrl - Webhook URL
 * @param {string} text - Message text
 * @param {string} imageUrl - URL of image
 * @returns {Promise<object>} Result
 */
async function sendMessageWithImage(webhookUrl, text, imageUrl) {
  try {
    const payload = {
      content: text,
      embeds: [
        {
          image: {
            url: imageUrl
          }
        }
      ]
    };
    
    const response = await axios.post(webhookUrl, payload);
    
    if (response.status === 204 || response.status === 200) {
      console.log('✅ Discord: Message with image posted successfully');
      return {
        success: true,
        platform: 'discord',
        message: 'Posted to Discord successfully'
      };
    }
    
    throw new Error('Discord API returned unexpected response');
  } catch (error) {
    console.error('❌ Discord image error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      platform: 'discord'
    };
  }
}

/**
 * Send a message with video to Discord
 * @param {string} webhookUrl - Webhook URL
 * @param {string} text - Message text
 * @param {string} videoUrl - URL of video
 * @returns {Promise<object>} Result
 */
async function sendMessageWithVideo(webhookUrl, text, videoUrl) {
  try {
    // Discord webhooks can include video URLs in embeds
    const payload = {
      content: text,
      embeds: [
        {
          title: '🎥 Video Content',
          description: `[Click here to watch the video](${videoUrl})`,
          color: 5814783, // Discord blue color
          fields: [
            {
              name: 'Video URL',
              value: videoUrl
            }
          ]
        }
      ]
    };
    
    const response = await axios.post(webhookUrl, payload);
    
    if (response.status === 204 || response.status === 200) {
      console.log('✅ Discord: Message with video posted successfully');
      return {
        success: true,
        platform: 'discord',
        message: 'Posted to Discord successfully'
      };
    }
    
    throw new Error('Discord API returned unexpected response');
  } catch (error) {
    console.error('❌ Discord video error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      platform: 'discord'
    };
  }
}

/**
 * Send message to Discord (main entry point)
 * Handles text, images, and videos
 * @param {string} webhookUrl - Webhook URL
 * @param {string} text - Message text
 * @param {string} mediaUrl - Optional media URL (image or video)
 * @returns {Promise<object>} Result
 */
async function sendToDiscord(webhookUrl, text, mediaUrl = null) {
  try {
    console.log('🎮 Sending to Discord...');
    
    if (mediaUrl) {
      // Check if media is video or image
      const isVideo = mediaUrl.includes('/video/') || 
                      mediaUrl.includes('.mp4') || 
                      mediaUrl.includes('.mov') ||
                      mediaUrl.includes('.avi') ||
                      mediaUrl.includes('video');
      
      if (isVideo) {
        // Send video with embed
        return await sendMessageWithVideo(webhookUrl, text, mediaUrl);
      } else {
        // Send image with embed
        return await sendMessageWithImage(webhookUrl, text, mediaUrl);
      }
    } else {
      // Send text only
      return await sendTextMessage(webhookUrl, text);
    }
  } catch (error) {
    console.error('❌ Discord send error:', error);
    return {
      success: false,
      error: error.message,
      platform: 'discord'
    };
  }
}

module.exports = {
  validateWebhook,
  sendToDiscord,
  sendTextMessage,
  sendMessageWithImage,
  sendMessageWithVideo
};

