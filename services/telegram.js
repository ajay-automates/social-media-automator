/**
 * Telegram Bot Service
 * Handle posting to Telegram using user's bot token
 * 
 * NO OAuth - users provide their own bot token from @BotFather
 */

const axios = require('axios');

/**
 * Validate a Telegram bot token
 * @param {string} botToken - Bot token from @BotFather
 * @returns {Promise<object>} Bot info or error
 */
async function validateBotToken(botToken) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    
    if (response.data.ok) {
      return {
        valid: true,
        bot: response.data.result
      };
    }
    
    return {
      valid: false,
      error: 'Invalid bot token'
    };
  } catch (error) {
    console.error('Telegram bot validation error:', error.response?.data || error.message);
    return {
      valid: false,
      error: error.response?.data?.description || 'Invalid bot token'
    };
  }
}

/**
 * Send a text message to Telegram
 * @param {string} botToken - Bot token
 * @param {string} chatId - Channel/chat ID
 * @param {string} text - Message text
 * @returns {Promise<object>} Result
 */
async function sendTextMessage(botToken, chatId, text) {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML' // Allow basic HTML formatting
      }
    );
    
    if (response.data.ok) {
      console.log('✅ Telegram: Text posted successfully');
      return {
        success: true,
        id: response.data.result.message_id,
        platform: 'telegram'
      };
    }
    
    throw new Error(response.data.description);
  } catch (error) {
    console.error('❌ Telegram text error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.description || error.message,
      platform: 'telegram'
    };
  }
}

/**
 * Send a photo to Telegram
 * @param {string} botToken - Bot token
 * @param {string} chatId - Channel/chat ID
 * @param {string} photoUrl - URL of photo
 * @param {string} caption - Optional caption
 * @returns {Promise<object>} Result
 */
async function sendPhoto(botToken, chatId, photoUrl, caption = '') {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
      }
    );
    
    if (response.data.ok) {
      console.log('✅ Telegram: Photo posted successfully');
      return {
        success: true,
        id: response.data.result.message_id,
        platform: 'telegram'
      };
    }
    
    throw new Error(response.data.description);
  } catch (error) {
    console.error('❌ Telegram photo error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.description || error.message,
      platform: 'telegram'
    };
  }
}

/**
 * Send a video to Telegram
 * @param {string} botToken - Bot token
 * @param {string} chatId - Channel/chat ID
 * @param {string} videoUrl - URL of video
 * @param {string} caption - Optional caption
 * @returns {Promise<object>} Result
 */
async function sendVideo(botToken, chatId, videoUrl, caption = '') {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendVideo`,
      {
        chat_id: chatId,
        video: videoUrl,
        caption: caption,
        parse_mode: 'HTML',
        supports_streaming: true // Allow video streaming
      }
    );
    
    if (response.data.ok) {
      console.log('✅ Telegram: Video posted successfully');
      return {
        success: true,
        id: response.data.result.message_id,
        platform: 'telegram'
      };
    }
    
    throw new Error(response.data.description);
  } catch (error) {
    console.error('❌ Telegram video error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.description || error.message,
      platform: 'telegram'
    };
  }
}

/**
 * Send a document to Telegram (for large files)
 * @param {string} botToken - Bot token
 * @param {string} chatId - Channel/chat ID
 * @param {string} documentUrl - URL of document
 * @param {string} caption - Optional caption
 * @returns {Promise<object>} Result
 */
async function sendDocument(botToken, chatId, documentUrl, caption = '') {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendDocument`,
      {
        chat_id: chatId,
        document: documentUrl,
        caption: caption,
        parse_mode: 'HTML'
      }
    );
    
    if (response.data.ok) {
      console.log('✅ Telegram: Document posted successfully');
      return {
        success: true,
        id: response.data.result.message_id,
        platform: 'telegram'
      };
    }
    
    throw new Error(response.data.description);
  } catch (error) {
    console.error('❌ Telegram document error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.description || error.message,
      platform: 'telegram'
    };
  }
}

/**
 * Send message to Telegram (main entry point)
 * Handles text, images, and videos
 * @param {string} botToken - Bot token
 * @param {string} chatId - Channel/chat ID
 * @param {string} text - Message text
 * @param {string} mediaUrl - Optional media URL (image/video)
 * @returns {Promise<object>} Result
 */
async function sendToTelegram(botToken, chatId, text, mediaUrl = null) {
  try {
    console.log('📱 Sending to Telegram...');
    
    // If media is provided, send media with caption
    if (mediaUrl) {
      const isVideo = mediaUrl.includes('/video/') || 
                      mediaUrl.includes('.mp4') || 
                      mediaUrl.includes('.mov') ||
                      mediaUrl.includes('video');
      
      if (isVideo) {
        // Send video with text as caption
        return await sendVideo(botToken, chatId, mediaUrl, text || '');
      } else {
        // Send photo with text as caption
        return await sendPhoto(botToken, chatId, mediaUrl, text || '');
      }
    } else {
      // Send text only
      return await sendTextMessage(botToken, chatId, text);
    }
  } catch (error) {
    console.error('❌ Telegram send error:', error);
    return {
      success: false,
      error: error.message,
      platform: 'telegram'
    };
  }
}

module.exports = {
  validateBotToken,
  sendToTelegram,
  sendTextMessage,
  sendPhoto,
  sendVideo,
  sendDocument
};

