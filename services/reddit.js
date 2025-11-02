/**
 * Reddit Service
 * Handle posting to Reddit using OAuth 2.0
 * Supports posting to moderated subreddits with text, images, videos, and links
 */

const axios = require('axios');

/**
 * Get list of subreddits user moderates
 * @param {string} accessToken - Reddit OAuth access token
 * @returns {Promise<Array>} - List of subreddit names
 */
async function getModeratedSubreddits(accessToken) {
  try {
    const response = await axios.get('https://oauth.reddit.com/subreddits/mine/moderator', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0'
      }
    });
    
    // Extract subreddit names from response
    const subreddits = response.data.data.children.map(sub => sub.data.display_name);
    
    console.log(`✅ Reddit: Found ${subreddits.length} moderated subreddits`);
    return subreddits;
  } catch (error) {
    console.error('❌ Reddit: Error fetching moderated subreddits:', error.response?.data || error.message);
    throw new Error(`Failed to fetch moderated subreddits: ${error.message}`);
  }
}

/**
 * Post text-only content to Reddit
 * @param {string} subreddit - Subreddit name (without r/)
 * @param {string} title - Post title (required, max 300 chars)
 * @param {string} text - Post text content
 * @param {string} accessToken - Reddit OAuth access token
 * @returns {Promise<object>} - Result object
 */
async function postTextToReddit(subreddit, title, text, accessToken) {
  try {
    const response = await axios.post(
      'https://oauth.reddit.com/api/submit',
      new URLSearchParams({
        sr: subreddit,
        kind: 'self',
        title: title.substring(0, 300), // Reddit title limit
        text: text,
        api_type: 'json'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.json && response.data.json.errors && response.data.json.errors.length > 0) {
      const error = response.data.json.errors[0];
      throw new Error(`Reddit API error: ${error[1]}`);
    }
    
    const postUrl = response.data.json.data.url;
    console.log(`✅ Reddit: Text post created - ${postUrl}`);
    
    return {
      success: true,
      platform: 'reddit',
      url: postUrl,
      id: response.data.json.data.id,
      message: `Posted to r/${subreddit}`
    };
  } catch (error) {
    console.error('❌ Reddit text post error:', error.response?.data || error.message);
    return {
      success: false,
      platform: 'reddit',
      error: error.message
    };
  }
}

/**
 * Post link to Reddit
 * @param {string} subreddit - Subreddit name
 * @param {string} title - Post title
 * @param {string} url - URL to share
 * @param {string} accessToken - Reddit OAuth access token
 * @returns {Promise<object>} - Result object
 */
async function postLinkToReddit(subreddit, title, url, accessToken) {
  try {
    const response = await axios.post(
      'https://oauth.reddit.com/api/submit',
      new URLSearchParams({
        sr: subreddit,
        kind: 'link',
        title: title.substring(0, 300),
        url: url,
        api_type: 'json'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.json && response.data.json.errors && response.data.json.errors.length > 0) {
      const error = response.data.json.errors[0];
      throw new Error(`Reddit API error: ${error[1]}`);
    }
    
    const postUrl = response.data.json.data.url;
    console.log(`✅ Reddit: Link post created - ${postUrl}`);
    
    return {
      success: true,
      platform: 'reddit',
      url: postUrl,
      id: response.data.json.data.id,
      message: `Posted link to r/${subreddit}`
    };
  } catch (error) {
    console.error('❌ Reddit link post error:', error.response?.data || error.message);
    return {
      success: false,
      platform: 'reddit',
      error: error.message
    };
  }
}

/**
 * Post image to Reddit
 * @param {string} subreddit - Subreddit name
 * @param {string} title - Post title
 * @param {string} imageUrl - URL of image to post
 * @param {string} accessToken - Reddit OAuth access token
 * @returns {Promise<object>} - Result object
 */
async function postImageToReddit(subreddit, title, imageUrl, accessToken) {
  try {
    // Reddit will fetch and host the image
    const response = await axios.post(
      'https://oauth.reddit.com/api/submit',
      new URLSearchParams({
        sr: subreddit,
        kind: 'image',
        title: title.substring(0, 300),
        url: imageUrl,
        api_type: 'json'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.json && response.data.json.errors && response.data.json.errors.length > 0) {
      const error = response.data.json.errors[0];
      throw new Error(`Reddit API error: ${error[1]}`);
    }
    
    const postUrl = response.data.json.data.url;
    console.log(`✅ Reddit: Image post created - ${postUrl}`);
    
    return {
      success: true,
      platform: 'reddit',
      url: postUrl,
      id: response.data.json.data.id,
      message: `Posted image to r/${subreddit}`
    };
  } catch (error) {
    console.error('❌ Reddit image post error:', error.response?.data || error.message);
    return {
      success: false,
      platform: 'reddit',
      error: error.message
    };
  }
}

/**
 * Post video to Reddit
 * @param {string} subreddit - Subreddit name
 * @param {string} title - Post title
 * @param {string} videoUrl - URL of video
 * @param {string} accessToken - Reddit OAuth access token
 * @returns {Promise<object>} - Result object
 */
async function postVideoToReddit(subreddit, title, videoUrl, accessToken) {
  try {
    // Post video as link (Reddit's video upload API is complex, posting as link is simpler)
    const response = await axios.post(
      'https://oauth.reddit.com/api/submit',
      new URLSearchParams({
        sr: subreddit,
        kind: 'link',
        title: title.substring(0, 300),
        url: videoUrl,
        api_type: 'json'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.json && response.data.json.errors && response.data.json.errors.length > 0) {
      const error = response.data.json.errors[0];
      throw new Error(`Reddit API error: ${error[1]}`);
    }
    
    const postUrl = response.data.json.data.url;
    console.log(`✅ Reddit: Video link post created - ${postUrl}`);
    
    return {
      success: true,
      platform: 'reddit',
      url: postUrl,
      id: response.data.json.data.id,
      message: `Posted video link to r/${subreddit}`
    };
  } catch (error) {
    console.error('❌ Reddit video post error:', error.response?.data || error.message);
    return {
      success: false,
      platform: 'reddit',
      error: error.message
    };
  }
}

/**
 * Main function to post to Reddit
 * Determines post type and routes to appropriate function
 * @param {string} subreddit - Subreddit name (without r/)
 * @param {string} title - Post title (required for Reddit)
 * @param {string} text - Post text content
 * @param {string} mediaUrl - Optional media URL (image or video)
 * @param {string} accessToken - Reddit OAuth access token
 * @returns {Promise<object>} - Result object
 */
async function postToReddit(subreddit, title, text, mediaUrl, accessToken) {
  try {
    console.log(`🔴 Posting to Reddit r/${subreddit}`);
    
    // Validate required fields
    if (!subreddit || !title) {
      throw new Error('Subreddit and title are required for Reddit posts');
    }
    
    // Determine post type and post accordingly
    if (mediaUrl) {
      // Check if media is video or image
      const isVideo = mediaUrl.includes('/video/') || 
                      mediaUrl.includes('.mp4') || 
                      mediaUrl.includes('.mov') ||
                      mediaUrl.includes('.avi') ||
                      mediaUrl.includes('video') ||
                      mediaUrl.includes('youtube.com') ||
                      mediaUrl.includes('youtu.be') ||
                      mediaUrl.includes('vimeo.com');
      
      if (isVideo) {
        return await postVideoToReddit(subreddit, title, mediaUrl, accessToken);
      } else {
        return await postImageToReddit(subreddit, title, mediaUrl, accessToken);
      }
    } else if (text) {
      // Check if text contains URLs (potential link post)
      const urlRegex = /(https?:\/\/[^\s]+)/;
      const urlMatch = text.match(urlRegex);
      
      if (urlMatch) {
        // Has URL in text - user might want link post or text post with URL
        // Default to text post to preserve the full message
        return await postTextToReddit(subreddit, title, text, accessToken);
      } else {
        // Plain text post
        return await postTextToReddit(subreddit, title, text, accessToken);
      }
    } else {
      throw new Error('Post must have either text or media content');
    }
  } catch (error) {
    console.error('❌ Reddit post error:', error);
    return {
      success: false,
      platform: 'reddit',
      error: error.message
    };
  }
}

module.exports = {
  getModeratedSubreddits,
  postTextToReddit,
  postLinkToReddit,
  postImageToReddit,
  postVideoToReddit,
  postToReddit
};

