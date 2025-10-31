/**
 * TikTok Integration Service
 * Handles OAuth and video posting to TikTok using Content Posting API
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

// TikTok API endpoints
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const TIKTOK_POST_VIDEO_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
const TIKTOK_POST_STATUS_URL = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';

// Required OAuth scopes
const REQUIRED_SCOPES = [
  'user.info.basic',
  'user.info.profile',
  'video.publish',
  'video.upload'
];

/**
 * Generate TikTok OAuth URL
 * @param {string} redirectUri - The OAuth callback URL
 * @param {string} state - CSRF protection state parameter
 * @returns {string} - Authorization URL
 */
function generateAuthUrl(redirectUri, state) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  
  if (!clientKey) {
    throw new Error('TIKTOK_CLIENT_KEY not configured');
  }

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: REQUIRED_SCOPES.join(','),
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state
  });

  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} redirectUri - Must match the one used in authorization
 * @returns {Promise<Object>} - Token response with access_token, refresh_token, etc.
 */
async function exchangeCodeForToken(code, redirectUri) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error('TikTok credentials not configured');
  }

  try {
    const response = await axios.post(
      TIKTOK_TOKEN_URL,
      new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (response.data.error && response.data.error.code !== 'ok') {
      throw new Error(`TikTok token exchange failed: ${response.data.error.message}`);
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      refreshExpiresIn: response.data.refresh_expires_in,
      openId: response.data.open_id,
      scope: response.data.scope,
      tokenType: response.data.token_type
    };
  } catch (error) {
    console.error('❌ TikTok token exchange error:', error.response?.data || error.message);
    throw new Error(`Failed to exchange TikTok authorization code: ${error.message}`);
  }
}

/**
 * Refresh an expired access token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} - New token response
 */
async function refreshAccessToken(refreshToken) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error('TikTok credentials not configured');
  }

  try {
    const response = await axios.post(
      TIKTOK_TOKEN_URL,
      new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (response.data.error && response.data.error.code !== 'ok') {
      throw new Error(`TikTok token refresh failed: ${response.data.error.message}`);
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      refreshExpiresIn: response.data.refresh_expires_in,
      openId: response.data.open_id,
      scope: response.data.scope
    };
  } catch (error) {
    console.error('❌ TikTok token refresh error:', error.response?.data || error.message);
    throw new Error(`Failed to refresh TikTok token: ${error.message}`);
  }
}

/**
 * Get user information
 * @param {string} accessToken - TikTok access token
 * @returns {Promise<Object>} - User profile information
 */
async function getUserInfo(accessToken) {
  try {
    const response = await axios.get(TIKTOK_USER_INFO_URL, {
      params: {
        fields: 'open_id,union_id,avatar_url,avatar_url_100,avatar_url_200,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.error && response.data.error.code !== 'ok') {
      throw new Error(`TikTok user info fetch failed: ${response.data.error.message}`);
    }

    const user = response.data.data.user;
    
    return {
      openId: user.open_id,
      unionId: user.union_id,
      username: user.display_name,
      displayName: user.display_name,
      avatarUrl: user.avatar_url_100 || user.avatar_url,
      bio: user.bio_description,
      isVerified: user.is_verified,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      likesCount: user.likes_count,
      videoCount: user.video_count,
      profileLink: user.profile_deep_link
    };
  } catch (error) {
    console.error('❌ TikTok get user info error:', error.response?.data || error.message);
    throw new Error(`Failed to get TikTok user info: ${error.message}`);
  }
}

/**
 * Post a video to TikTok
 * @param {string} accessToken - TikTok access token
 * @param {Object} postData - Post data
 * @param {string} postData.videoUrl - URL of the video to post (must be publicly accessible)
 * @param {string} postData.caption - Video caption/description
 * @param {string} postData.privacyLevel - Privacy level: PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY, FOLLOWER_OF_CREATOR
 * @param {boolean} postData.disableComment - Disable comments (default: false)
 * @param {boolean} postData.disableDuet - Disable duets (default: false)
 * @param {boolean} postData.disableStitch - Disable stitches (default: false)
 * @returns {Promise<Object>} - Publish response with publish_id
 */
async function postVideo(accessToken, postData) {
  const {
    videoUrl,
    caption = '',
    privacyLevel = 'PUBLIC_TO_EVERYONE',
    disableComment = false,
    disableDuet = false,
    disableStitch = false
  } = postData;

  if (!videoUrl) {
    throw new Error('Video URL is required for TikTok posting');
  }

  try {
    console.log('🎬 Initializing TikTok video post...');
    
    // Step 1: Initialize video upload with PULL_FROM_URL method
    const initResponse = await axios.post(
      TIKTOK_POST_VIDEO_INIT_URL,
      {
        post_info: {
          title: caption.substring(0, 150), // TikTok has a 150 character limit for titles
          privacy_level: privacyLevel,
          disable_comment: disableComment,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
          video_cover_timestamp_ms: 1000 // Use frame at 1 second as cover
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        }
      }
    );

    if (initResponse.data.error && initResponse.data.error.code !== 'ok') {
      throw new Error(`TikTok video init failed: ${initResponse.data.error.message}`);
    }

    const publishId = initResponse.data.data.publish_id;
    
    console.log(`✅ TikTok video initialized successfully! Publish ID: ${publishId}`);
    console.log('⏳ Video is being processed by TikTok. User will receive notification when ready.');

    // Note: With PULL_FROM_URL, TikTok handles the upload automatically
    // The user will receive an in-app notification when the video is ready to be published
    
    return {
      success: true,
      publishId: publishId,
      status: 'processing',
      message: 'Video uploaded to TikTok inbox. User will receive notification when ready to publish.',
      url: null // TikTok doesn't provide a direct URL until user publishes from app
    };
  } catch (error) {
    console.error('❌ TikTok post video error:', error.response?.data || error.message);
    
    // Check for specific TikTok errors
    if (error.response?.data?.error) {
      const tiktokError = error.response.data.error;
      throw new Error(`TikTok API Error [${tiktokError.code}]: ${tiktokError.message}`);
    }
    
    throw new Error(`Failed to post video to TikTok: ${error.message}`);
  }
}

/**
 * Check the status of a published video
 * @param {string} accessToken - TikTok access token
 * @param {string} publishId - The publish_id returned from postVideo
 * @returns {Promise<Object>} - Status information
 */
async function checkPublishStatus(accessToken, publishId) {
  try {
    const response = await axios.post(
      TIKTOK_POST_STATUS_URL,
      {
        publish_id: publishId
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        }
      }
    );

    if (response.data.error && response.data.error.code !== 'ok') {
      throw new Error(`Status check failed: ${response.data.error.message}`);
    }

    const status = response.data.data;
    
    return {
      publishId: publishId,
      status: status.status, // PUBLISH_COMPLETE, PROCESSING_UPLOAD, FAILED, etc.
      failReason: status.fail_reason,
      publiclyAvailablePostId: status.publicly_available_post_id
    };
  } catch (error) {
    console.error('❌ TikTok check status error:', error.response?.data || error.message);
    throw new Error(`Failed to check TikTok publish status: ${error.message}`);
  }
}

/**
 * Validate that a video URL is accessible for TikTok to pull
 * @param {string} videoUrl - URL to validate
 * @returns {Promise<boolean>} - True if accessible
 */
async function validateVideoUrl(videoUrl) {
  try {
    // Check if URL is reachable with HEAD request
    const response = await axios.head(videoUrl, {
      timeout: 5000,
      validateStatus: (status) => status === 200
    });
    
    // Check content type
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('video/')) {
      console.warn(`⚠️ URL content-type is ${contentType}, expected video/*`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Video URL validation failed:', error.message);
    return false;
  }
}

module.exports = {
  generateAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getUserInfo,
  postVideo,
  checkPublishStatus,
  validateVideoUrl,
  REQUIRED_SCOPES
};
