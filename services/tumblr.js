const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

const TUMBLR_API_BASE = 'https://api.tumblr.com/v2';

// OAuth 1.0a configuration
const oauth = OAuth({
  consumer: {
    key: process.env.TUMBLR_CONSUMER_KEY,
    secret: process.env.TUMBLR_CONSUMER_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  }
});

/**
 * Get request token (Step 1 of OAuth 1.0a flow)
 * @param {string} callbackUrl - OAuth callback URL
 * @returns {Object} Request token and secret
 */
async function getRequestToken(callbackUrl) {
  try {
    const requestData = {
      url: 'https://www.tumblr.com/oauth/request_token?oauth_callback=' + encodeURIComponent(callbackUrl),
      method: 'POST'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));

    const response = await axios.post(
      'https://www.tumblr.com/oauth/request_token',
      `oauth_callback=${encodeURIComponent(callbackUrl)}`,
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Parse response (format: oauth_token=xxx&oauth_token_secret=yyy&oauth_callback_confirmed=true)
    const params = new URLSearchParams(response.data);
    const requestToken = params.get('oauth_token');
    const requestTokenSecret = params.get('oauth_token_secret');

    console.log('✅ Tumblr request token obtained');

    return {
      success: true,
      requestToken,
      requestTokenSecret
    };

  } catch (error) {
    console.error('❌ Error getting Tumblr request token:', error.response?.data || error.message);
    throw new Error('Failed to get Tumblr request token: ' + (error.response?.data || error.message));
  }
}

/**
 * Get access token (Step 3 of OAuth 1.0a flow)
 * @param {string} oauthToken - Request token
 * @param {string} oauthTokenSecret - Request token secret
 * @param {string} oauthVerifier - Verifier from callback
 * @returns {Object} Access token and secret
 */
async function getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier) {
  try {
    const token = {
      key: oauthToken,
      secret: oauthTokenSecret
    };

    const requestData = {
      url: `https://www.tumblr.com/oauth/access_token?oauth_verifier=${oauthVerifier}`,
      method: 'POST'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const response = await axios.post(
      'https://www.tumblr.com/oauth/access_token',
      `oauth_verifier=${oauthVerifier}`,
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Parse response
    const params = new URLSearchParams(response.data);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    console.log('✅ Tumblr access token obtained');

    return {
      success: true,
      accessToken,
      accessTokenSecret
    };

  } catch (error) {
    console.error('❌ Error getting Tumblr access token:', error.response?.data || error.message);
    throw new Error('Failed to get Tumblr access token');
  }
}

/**
 * Get user info (blogs list)
 * @param {string} accessToken - OAuth access token
 * @param {string} accessTokenSecret - OAuth token secret
 * @returns {Object} User info with primary blog
 */
async function getTumblrUserInfo(accessToken, accessTokenSecret) {
  try {
    const token = {
      key: accessToken,
      secret: accessTokenSecret
    };

    const requestData = {
      url: `${TUMBLR_API_BASE}/user/info`,
      method: 'GET'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const response = await axios.get(requestData.url, {
      headers: authHeader
    });

    const user = response.data.response.user;
    const primaryBlog = user.blogs.find(blog => blog.primary) || user.blogs[0];

    console.log(`✅ Retrieved Tumblr user info: ${primaryBlog.name} (${user.name})`);

    return {
      success: true,
      name: user.name,
      blogs: user.blogs,
      primaryBlog: {
        name: primaryBlog.name, // e.g., "myblog"
        title: primaryBlog.title,
        url: primaryBlog.url,
        uuid: primaryBlog.uuid
      }
    };

  } catch (error) {
    console.error('❌ Error getting Tumblr user info:', error.response?.data || error.message);
    throw new Error('Failed to get Tumblr user info');
  }
}

/**
 * Post to Tumblr blog
 * @param {string} blogIdentifier - Blog name (e.g., "myblog.tumblr.com" or just "myblog")
 * @param {string} type - Post type (text, photo, quote, link, chat, audio, video)
 * @param {Object} postData - Post content (varies by type)
 * @param {Object} credentials - OAuth credentials
 * @returns {Object} Post result
 */
async function postToTumblr(blogIdentifier, type, postData, credentials) {
  try {
    const { accessToken, accessTokenSecret, blogName } = credentials;

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Missing Tumblr credentials');
    }

    const blogId = blogIdentifier || blogName;

    console.log(`📝 Posting to Tumblr blog: ${blogId}...`);

    const token = {
      key: accessToken,
      secret: accessTokenSecret
    };

    // Prepare form data (OAuth 1.0a works better with form-encoded data)
    const bodyParams = { type, ...postData };
    
    const requestData = {
      url: `${TUMBLR_API_BASE}/blog/${blogId}/post`,
      method: 'POST',
      data: bodyParams
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    // Convert to form data
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(bodyParams)) {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    }

    const response = await axios.post(
      requestData.url,
      formData.toString(),
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const postId = response.data.response.id;
    const postUrl = `https://${blogId}.tumblr.com/post/${postId}`;

    console.log(`✅ Successfully posted to Tumblr: ${postUrl}`);

    return {
      success: true,
      postId,
      url: postUrl,
      account: blogId,
      platform: 'tumblr'
    };

  } catch (error) {
    console.error('❌ Error posting to Tumblr:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to post to Tumblr';
    if (error.response?.data?.meta?.msg) {
      errorMessage = error.response.data.meta.msg;
    } else if (error.response?.data?.errors) {
      errorMessage = error.response.data.errors[0] || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      account: credentials.blogName || 'Tumblr',
      platform: 'tumblr'
    };
  }
}

/**
 * Create text post on Tumblr
 * @param {string} title - Post title
 * @param {string} body - Post body (supports HTML and markdown)
 * @param {Array} tags - Tags array
 * @param {Object} credentials - OAuth credentials
 * @returns {Object} Post result
 */
async function createTextPost(title, body, tags = [], credentials) {
  const postData = {
    title,
    body,
    tags: tags.join(','),
    format: 'markdown' // or 'html'
  };

  return postToTumblr(credentials.blogName, 'text', postData, credentials);
}

/**
 * Create photo post on Tumblr
 * @param {string} caption - Photo caption
 * @param {string} imageUrl - Image URL (or array of URLs)
 * @param {Array} tags - Tags array
 * @param {Object} credentials - OAuth credentials
 * @returns {Object} Post result
 */
async function createPhotoPost(caption, imageUrl, tags = [], credentials) {
  const postData = {
    caption,
    source: imageUrl, // Can be URL or array of URLs
    tags: tags.join(','),
    format: 'markdown'
  };

  return postToTumblr(credentials.blogName, 'photo', postData, credentials);
}

/**
 * Extract tags from text
 * @param {string} text - Post text
 * @returns {Array} Array of tags (without #)
 */
function extractTags(text) {
  if (!text) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove # symbol
  return matches.map(tag => tag.substring(1));
}

/**
 * Format content for Tumblr
 * @param {string} text - Post text
 * @param {string} imageUrl - Optional image URL
 * @returns {Object} Formatted post data with type
 */
function formatTumblrPost(text, imageUrl = null) {
  const tags = extractTags(text);
  
  if (imageUrl) {
    // Photo post with caption
    return {
      type: 'photo',
      data: {
        caption: text,
        source: imageUrl,
        tags: tags.join(','),
        format: 'markdown'
      }
    };
  } else {
    // Text post
    // Try to extract title from first line
    const lines = text.split('\n');
    const title = lines[0].trim() || 'Untitled Post';
    const body = lines.length > 1 ? lines.slice(1).join('\n').trim() : text;
    
    return {
      type: 'text',
      data: {
        title,
        body,
        tags: tags.join(','),
        format: 'markdown'
      }
    };
  }
}

module.exports = {
  getRequestToken,
  getAccessToken,
  getTumblrUserInfo,
  postToTumblr,
  createTextPost,
  createPhotoPost,
  extractTags,
  formatTumblrPost
};

