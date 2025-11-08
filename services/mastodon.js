const axios = require('axios');

/**
 * Post status to Mastodon
 * @param {string} status - Post text/status
 * @param {string} mediaUrl - Optional media URL
 * @param {string} visibility - public, unlisted, private, direct (default: public)
 * @param {Object} credentials - User's Mastodon credentials
 * @returns {Object} Post result
 */
async function postToMastodon(status, mediaUrl = null, visibility = 'public', credentials) {
  try {
    const { accessToken, instanceUrl } = credentials;

    if (!accessToken || !instanceUrl) {
      throw new Error('Missing Mastodon credentials');
    }

    const apiBase = instanceUrl.replace(/\/$/, ''); // Remove trailing slash

    console.log(`🐘 Posting to Mastodon (${apiBase})...`);

    let mediaId = null;

    // Upload media if provided
    if (mediaUrl) {
      try {
        // Download image and upload to Mastodon
        const imageResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', Buffer.from(imageResponse.data), {
          filename: 'image.jpg',
          contentType: imageResponse.headers['content-type'] || 'image/jpeg'
        });

        const uploadResponse = await axios.post(
          `${apiBase}/api/v2/media`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        mediaId = uploadResponse.data.id;
        console.log(`  ✅ Media uploaded: ${mediaId}`);

        // Wait for media to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (mediaError) {
        console.error('  ⚠️ Media upload failed, posting without image:', mediaError.message);
      }
    }

    // Create status post
    const postData = {
      status,
      visibility
    };

    if (mediaId) {
      postData.media_ids = [mediaId];
    }

    const response = await axios.post(
      `${apiBase}/api/v1/statuses`,
      postData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const post = response.data;

    console.log(`✅ Posted to Mastodon: ${post.url}`);

    return {
      success: true,
      postId: post.id,
      url: post.url,
      account: credentials.username || instanceUrl
    };

  } catch (error) {
    console.error('❌ Error posting to Mastodon:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to post to Mastodon';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      account: credentials.username || credentials.instanceUrl
    };
  }
}

/**
 * Verify Mastodon credentials and get account info
 * @param {string} accessToken - User's access token
 * @param {string} instanceUrl - Mastodon instance URL
 * @returns {Object} Account info
 */
async function verifyMastodonCredentials(accessToken, instanceUrl) {
  try {
    const apiBase = instanceUrl.replace(/\/$/, '');

    const response = await axios.get(`${apiBase}/api/v1/accounts/verify_credentials`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const account = response.data;

    console.log(`✅ Mastodon account verified: @${account.username}@${new URL(instanceUrl).hostname}`);

    return {
      success: true,
      id: account.id,
      username: account.username,
      displayName: account.display_name,
      acct: account.acct, // Full handle (e.g., "username@instance.social")
      url: account.url,
      avatar: account.avatar,
      followersCount: account.followers_count
    };

  } catch (error) {
    console.error('❌ Error verifying Mastodon credentials:', error.response?.data || error.message);
    throw new Error('Invalid Mastodon credentials: ' + (error.response?.data?.error || error.message));
  }
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
 * Format status for Mastodon (handles character limits and hashtags)
 * @param {string} text - Post text
 * @param {number} maxLength - Max character length (default: 500)
 * @returns {string} Formatted status
 */
function formatMastodonStatus(text, maxLength = 500) {
  if (!text) return '';
  
  // Mastodon default limit is 500 characters (configurable per instance)
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate and add ellipsis
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get instance info
 * @param {string} instanceUrl - Mastodon instance URL
 * @returns {Object} Instance information
 */
async function getInstanceInfo(instanceUrl) {
  try {
    const apiBase = instanceUrl.replace(/\/$/, '');
    
    const response = await axios.get(`${apiBase}/api/v1/instance`);
    
    return {
      success: true,
      title: response.data.title,
      description: response.data.description,
      version: response.data.version,
      maxCharacters: response.data.configuration?.statuses?.max_characters || 500,
      maxMediaAttachments: response.data.configuration?.statuses?.max_media_attachments || 4
    };

  } catch (error) {
    console.error('Error getting Mastodon instance info:', error.message);
    return {
      success: false,
      maxCharacters: 500,
      maxMediaAttachments: 4
    };
  }
}

module.exports = {
  postToMastodon,
  verifyMastodonCredentials,
  extractHashtags,
  formatMastodonStatus,
  getInstanceInfo
};

