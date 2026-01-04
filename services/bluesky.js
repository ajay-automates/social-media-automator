const axios = require('axios');

const BLUESKY_API_URL = 'https://bsky.social/xrpc';

/**
 * Create Bluesky session (login with app password)
 * @param {string} handle - Bluesky handle (e.g., username.bsky.social)
 * @param {string} appPassword - App password
 * @returns {Object} Session data with accessJwt and did
 */
async function createBlueskySession(handle, appPassword) {
  try {
    console.log(`🦋 Creating Bluesky session for ${handle}...`);

    const response = await axios.post(`${BLUESKY_API_URL}/com.atproto.server.createSession`, {
      identifier: handle,
      password: appPassword
    });

    const { accessJwt, refreshJwt, did, handle: returnedHandle } = response.data;

    console.log(`✅ Bluesky session created: ${returnedHandle} (${did})`);

    return {
      success: true,
      accessJwt,
      refreshJwt,
      did,
      handle: returnedHandle
    };

  } catch (error) {
    console.error('❌ Error creating Bluesky session:', error.response?.data || error.message);
    throw new Error('Invalid Bluesky credentials: ' + (error.response?.data?.message || error.message));
  }
}

/**
 * Refresh Bluesky session token
 * @param {string} refreshJwt - Refresh token
 * @returns {Object} New session tokens
 */
async function refreshBlueskySession(refreshJwt) {
  try {
    const response = await axios.post(`${BLUESKY_API_URL}/com.atproto.server.refreshSession`, {}, {
      headers: {
        'Authorization': `Bearer ${refreshJwt}`
      }
    });

    const { accessJwt, refreshJwt: newRefreshJwt } = response.data;

    return {
      success: true,
      accessJwt,
      refreshJwt: newRefreshJwt
    };

  } catch (error) {
    console.error('Error refreshing Bluesky session:', error.message);
    throw error;
  }
}

/**
 * Post to Bluesky
 * @param {string} text - Post text
 * @param {string} imageUrl - Optional image URL
 * @param {Object} credentials - User's Bluesky credentials
 * @returns {Object} Post result
 */
async function postToBluesky(text, imageUrl = null, credentials) {
  try {
    const { accessJwt, did, handle } = credentials;

    if (!accessJwt || !did) {
      throw new Error('Missing Bluesky credentials');
    }

    console.log(`🦋 Posting to Bluesky (@${handle})...`);

    // Prepare post record
    const record = {
      text: formatBlueskyText(text),
      createdAt: new Date().toISOString(),
      $type: 'app.bsky.feed.post'
    };

    // Upload image if provided
    if (imageUrl) {
      try {
        const imageBlob = await uploadBlueskyImage(imageUrl, accessJwt);
        if (imageBlob) {
          record.embed = {
            $type: 'app.bsky.embed.images',
            images: [imageBlob]
          };
          console.log(`  ✅ Image uploaded`);
        }
      } catch (imageError) {
        console.error('  ⚠️ Image upload failed, posting without image:', imageError.message);
      }
    }

    // Create post
    const response = await axios.post(
      `${BLUESKY_API_URL}/com.atproto.repo.createRecord`,
      {
        repo: did,
        collection: 'app.bsky.feed.post',
        record
      },
      {
        headers: {
          'Authorization': `Bearer ${accessJwt}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { uri, cid } = response.data;
    
    // Construct post URL
    const postId = uri.split('/').pop();
    const postUrl = `https://bsky.app/profile/${handle}/post/${postId}`;

    console.log(`✅ Posted to Bluesky: ${postUrl}`);

    return {
      success: true,
      postId,
      uri,
      cid,
      url: postUrl,
      account: handle,
      platform: 'bluesky'
    };

  } catch (error) {
    console.error('❌ Error posting to Bluesky:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to post to Bluesky';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      account: credentials.handle,
      platform: 'bluesky'
    };
  }
}

/**
 * Upload image to Bluesky
 * @param {string} imageUrl - Image URL to upload
 * @param {string} accessJwt - Access token
 * @returns {Object} Image blob data
 */
async function uploadBlueskyImage(imageUrl, accessJwt) {
  try {
    // Download image
    const imageResponse = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const imageBuffer = Buffer.from(imageResponse.data);
    const contentType = imageResponse.headers['content-type'] || 'image/jpeg';

    // Upload to Bluesky
    const uploadResponse = await axios.post(
      `${BLUESKY_API_URL}/com.atproto.repo.uploadBlob`,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${accessJwt}`,
          'Content-Type': contentType
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    return {
      alt: '',
      image: uploadResponse.data.blob
    };

  } catch (error) {
    console.error('Error uploading image to Bluesky:', error.message);
    throw error;
  }
}

/**
 * Verify Bluesky credentials and get account info
 * @param {string} handle - Bluesky handle
 * @param {string} appPassword - App password
 * @returns {Object} Account info
 */
async function verifyBlueskyCredentials(handle, appPassword) {
  try {
    const session = await createBlueskySession(handle, appPassword);

    // Get profile info
    const profileResponse = await axios.get(
      `${BLUESKY_API_URL}/app.bsky.actor.getProfile`,
      {
        params: { actor: session.handle },
        headers: {
          'Authorization': `Bearer ${session.accessJwt}`
        }
      }
    );

    const profile = profileResponse.data;

    console.log(`✅ Bluesky account verified: @${profile.handle}`);

    return {
      success: true,
      did: session.did,
      handle: profile.handle,
      displayName: profile.displayName || profile.handle,
      avatar: profile.avatar,
      followersCount: profile.followersCount,
      followsCount: profile.followsCount,
      postsCount: profile.postsCount,
      accessJwt: session.accessJwt,
      refreshJwt: session.refreshJwt
    };

  } catch (error) {
    console.error('❌ Error verifying Bluesky credentials:', error.response?.data || error.message);
    throw new Error('Invalid Bluesky credentials: ' + (error.response?.data?.message || error.message));
  }
}

/**
 * Format text for Bluesky (handles character limits and special formatting)
 * @param {string} text - Post text
 * @param {number} maxLength - Max character length (default: 300)
 * @returns {string} Formatted text
 */
function formatBlueskyText(text, maxLength = 300) {
  if (!text) return '';
  
  // Bluesky limit is 300 characters
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate and add ellipsis
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Extract hashtags from text
 * @param {string} text - Post text
 * @returns {Array} Array of hashtags (with #)
 */
function extractHashtags(text) {
  if (!text) return [];
  
  const hashtagRegex = /#\w+/g;
  const matches = text.match(hashtagRegex);
  
  return matches || [];
}

/**
 * Get Bluesky profile info
 * @param {string} handle - Bluesky handle
 * @param {string} accessJwt - Access token
 * @returns {Object} Profile information
 */
async function getBlueskyProfile(handle, accessJwt) {
  try {
    const response = await axios.get(
      `${BLUESKY_API_URL}/app.bsky.actor.getProfile`,
      {
        params: { actor: handle },
        headers: {
          'Authorization': `Bearer ${accessJwt}`
        }
      }
    );

    return {
      success: true,
      profile: response.data
    };

  } catch (error) {
    console.error('Error getting Bluesky profile:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createBlueskySession,
  refreshBlueskySession,
  postToBluesky,
  uploadBlueskyImage,
  verifyBlueskyCredentials,
  formatBlueskyText,
  extractHashtags,
  getBlueskyProfile
};

