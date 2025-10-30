/**
 * Facebook Service
 * Handles posting to Facebook Pages via Graph API
 */

const axios = require('axios');

/**
 * Post to a Facebook Page
 * @param {string} text - Post caption/text
 * @param {string} mediaUrl - URL to image/video (optional)
 * @param {object} credentials - { pageId, accessToken }
 * @returns {object} Post result
 */
async function postToFacebookPage(text, mediaUrl, credentials) {
  const { pageId, accessToken } = credentials;

  if (!pageId || !accessToken) {
    throw new Error('Facebook Page ID and access token required');
  }

  try {
    let result;

    // If image/video URL provided, upload to Facebook first
    if (mediaUrl) {
      console.log('📘 Uploading media to Facebook...');
      
      // Check if it's an image or video
      const isVideo = mediaUrl.match(/\.(mp4|mov|avi|webm)$/i);
      
      if (isVideo) {
        // Upload video
        result = await uploadAndPostVideo(text, mediaUrl, { pageId, accessToken });
      } else {
        // Upload image
        result = await uploadAndPostImage(text, mediaUrl, { pageId, accessToken });
      }
    } else {
      // Text-only post
      console.log('📘 Posting text-only to Facebook...');
      result = await postTextOnly(text, { pageId, accessToken });
    }

    console.log('✅ Facebook post successful:', result.id);
    const postUrl = result.permalink_url || `https://www.facebook.com/${pageId}/posts/${result.id}`;
    return {
      success: true,
      postId: result.id,
      id: result.id, // For backward compatibility
      permalink: postUrl,
      url: postUrl, // For consistency with other platforms
      platform: 'facebook',
      message: text
    };

  } catch (error) {
    console.error('❌ Facebook posting error:', error.message);
    
    // Handle specific Facebook API errors
    let errorMessage = error.message;
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      errorMessage = `Facebook error: ${fbError.message} (${fbError.type})`;
    } else {
      errorMessage = 'Failed to post to Facebook: ' + error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      platform: 'facebook',
      errorCode: error.response?.status,
      errorReason: error.response?.data?.error?.type
    };
  }
}

/**
 * Upload image and post to Facebook Page
 */
async function uploadAndPostImage(text, imageUrl, credentials) {
  const { pageId, accessToken } = credentials;

  // Step 1: Upload photo to Facebook
  const uploadResponse = await axios.post(
    `https://graph.facebook.com/v18.0/${pageId}/photos`,
    null,
    {
      params: {
        url: imageUrl,
        caption: text,
        access_token: accessToken
      }
    }
  );

  console.log('✅ Image uploaded to Facebook:', uploadResponse.data.id);
  return uploadResponse.data;
}

/**
 * Upload video and post to Facebook Page
 */
async function uploadAndPostVideo(text, videoUrl, credentials) {
  const { pageId, accessToken } = credentials;

  // Step 1: Initialize video upload
  const initResponse = await axios.post(
    `https://graph.facebook.com/v18.0/${pageId}/videos`,
    null,
    {
      params: {
        file_url: videoUrl,
        description: text,
        access_token: accessToken
      }
    }
  );

  console.log('✅ Video upload initiated:', initResponse.data.id);
  return initResponse.data;
}

/**
 * Post text-only to Facebook Page
 */
async function postTextOnly(text, credentials) {
  const { pageId, accessToken } = credentials;

  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${pageId}/feed`,
    null,
    {
      params: {
        message: text,
        access_token: accessToken
      }
    }
  );

  return response.data;
}

/**
 * Get Facebook Page info
 * @param {object} credentials - { pageId, accessToken }
 * @returns {object} Page info
 */
async function getPageInfo(credentials) {
  const { pageId, accessToken } = credentials;

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}`,
      {
        params: {
          fields: 'id,name,username,picture',
          access_token: accessToken
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Failed to get Facebook Page info:', error.message);
    throw error;
  }
}

module.exports = {
  postToFacebookPage,
  getPageInfo
};
