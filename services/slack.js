/**
 * Slack Service
 * Handle posting to Slack using incoming webhooks
 * 
 * NO OAuth - users provide their own webhook URL from Slack
 */

const axios = require('axios');

/**
 * Validate a Slack webhook URL
 * @param {string} webhookUrl - Webhook URL from Slack
 * @returns {Promise<object>} Validation result
 */
async function validateWebhook(webhookUrl) {
  try {
    // Check URL format
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/services/')) {
      return {
        valid: false,
        error: 'Invalid Slack webhook URL. Must start with https://hooks.slack.com/services/'
      };
    }
    
    // Test webhook with a simple message
    const testPayload = {
      text: '✅ Slack webhook connected successfully! You can now post to this channel from Social Media Automator.'
    };
    
    const response = await axios.post(webhookUrl, testPayload);
    
    if (response.status === 200 && response.data === 'ok') {
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
    console.error('Slack webhook validation error:', error.response?.data || error.message);
    return {
      valid: false,
      error: error.response?.data || error.message || 'Invalid webhook URL'
    };
  }
}

/**
 * Send a text message to Slack
 * @param {string} webhookUrl - Webhook URL
 * @param {string} text - Message text
 * @returns {Promise<object>} Result
 */
async function sendTextMessage(webhookUrl, text) {
  try {
    const payload = {
      text: text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: text
          }
        }
      ]
    };
    
    const response = await axios.post(webhookUrl, payload);
    
    if (response.status === 200 && response.data === 'ok') {
      console.log('✅ Slack: Text posted successfully');
      return {
        success: true,
        platform: 'slack',
        message: 'Posted to Slack successfully'
      };
    }
    
    throw new Error('Slack API returned unexpected response');
  } catch (error) {
    console.error('❌ Slack text error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
      platform: 'slack'
    };
  }
}

/**
 * Send a message with image to Slack
 * @param {string} webhookUrl - Webhook URL
 * @param {string} text - Message text
 * @param {string} imageUrl - URL of image
 * @returns {Promise<object>} Result
 */
async function sendMessageWithImage(webhookUrl, text, imageUrl) {
  try {
    const payload = {
      text: text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: text
          }
        },
        {
          type: 'image',
          image_url: imageUrl,
          alt_text: 'Post image'
        }
      ]
    };
    
    const response = await axios.post(webhookUrl, payload);
    
    if (response.status === 200 && response.data === 'ok') {
      console.log('✅ Slack: Message with image posted successfully');
      return {
        success: true,
        platform: 'slack',
        message: 'Posted to Slack successfully'
      };
    }
    
    throw new Error('Slack API returned unexpected response');
  } catch (error) {
    console.error('❌ Slack image error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
      platform: 'slack'
    };
  }
}

/**
 * Send message to Slack (main entry point)
 * Handles text and optional images
 * @param {string} webhookUrl - Webhook URL
 * @param {string} text - Message text
 * @param {string} mediaUrl - Optional media URL (image only for Slack)
 * @returns {Promise<object>} Result
 */
async function sendToSlack(webhookUrl, text, mediaUrl = null) {
  try {
    console.log('💬 Sending to Slack...');
    
    // Slack incoming webhooks support images but not videos
    // If video is provided, send text only with a note
    if (mediaUrl) {
      const isVideo = mediaUrl.includes('/video/') || 
                      mediaUrl.includes('.mp4') || 
                      mediaUrl.includes('.mov') ||
                      mediaUrl.includes('video');
      
      if (isVideo) {
        // Slack webhooks don't support video, send text with video link
        const textWithLink = `${text}\n\n🎥 Video: ${mediaUrl}`;
        return await sendTextMessage(webhookUrl, textWithLink);
      } else {
        // Send image with text
        return await sendMessageWithImage(webhookUrl, text, mediaUrl);
      }
    } else {
      // Send text only
      return await sendTextMessage(webhookUrl, text);
    }
  } catch (error) {
    console.error('❌ Slack send error:', error);
    return {
      success: false,
      error: error.message,
      platform: 'slack'
    };
  }
}

module.exports = {
  validateWebhook,
  sendToSlack,
  sendTextMessage,
  sendMessageWithImage
};

