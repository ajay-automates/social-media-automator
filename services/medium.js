const axios = require('axios');

const MEDIUM_API_BASE = 'https://api.medium.com/v1';

/**
 * Post content to Medium
 * @param {string} title - Post title (required)
 * @param {string} content - Post content (Markdown or HTML)
 * @param {string} contentFormat - 'markdown' or 'html' (default: markdown)
 * @param {string} publishStatus - 'public', 'draft', or 'unlisted'
 * @param {Array} tags - Array of tags (max 3)
 * @param {string} canonicalUrl - Original URL if cross-posting
 * @param {Object} credentials - User's Medium credentials
 * @returns {Object} Post result with URL and ID
 */
async function postToMedium(title, content, contentFormat = 'markdown', publishStatus = 'public', tags = [], canonicalUrl = null, credentials) {
  try {
    const { accessToken, userId, username } = credentials;

    if (!accessToken || !userId) {
      throw new Error('Missing Medium credentials (accessToken or userId)');
    }

    // Prepare post data
    const postData = {
      title,
      content,
      contentFormat,
      publishStatus,
      tags: tags.slice(0, 3) // Medium allows max 3 tags
    };

    if (canonicalUrl) {
      postData.canonicalUrl = canonicalUrl;
    }

    console.log(`📝 Posting to Medium for user ${userId} (@${username})...`);

    // Make API call
    const response = await axios.post(
      `${MEDIUM_API_BASE}/users/${userId}/posts`,
      postData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8'
        }
      }
    );

    const postData_response = response.data.data;

    console.log(`✅ Successfully posted to Medium: ${postData_response.url}`);

    return {
      success: true,
      postId: postData_response.id,
      url: postData_response.url,
      publishStatus: postData_response.publishStatus,
      account: username || 'Medium'
    };

  } catch (error) {
    console.error('❌ Error posting to Medium:', error.response?.data || error.message);
    
    // Extract error message
    let errorMessage = 'Failed to post to Medium';
    if (error.response?.data?.errors && error.response.data.errors.length > 0) {
      errorMessage = error.response.data.errors[0].message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      account: credentials.username || 'Medium'
    };
  }
}

/**
 * Get Medium user info
 * @param {string} accessToken - User's access token
 * @returns {Object} User info including userId, username, name, imageUrl
 */
async function getMediumUserInfo(accessToken) {
  try {
    const response = await axios.get(`${MEDIUM_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    });

    const userData = response.data.data;

    console.log(`✅ Retrieved Medium user info: @${userData.username} (${userData.name})`);

    return {
      success: true,
      userId: userData.id,
      username: userData.username,
      name: userData.name,
      imageUrl: userData.imageUrl,
      url: userData.url
    };

  } catch (error) {
    console.error('❌ Error getting Medium user info:', error.response?.data || error.message);
    throw new Error('Failed to get Medium user info: ' + (error.response?.data?.errors?.[0]?.message || error.message));
  }
}

/**
 * Get user's Medium publications
 * @param {string} accessToken - User's access token
 * @param {string} userId - User's Medium ID
 * @returns {Array} List of publications user contributes to
 */
async function getMediumPublications(accessToken, userId) {
  try {
    const response = await axios.get(
      `${MEDIUM_API_BASE}/users/${userId}/publications`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8'
        }
      }
    );

    const publications = response.data.data || [];
    console.log(`✅ Retrieved ${publications.length} Medium publications`);

    return publications;

  } catch (error) {
    console.error('⚠️ Error getting Medium publications:', error.response?.data || error.message);
    // Don't throw, just return empty array
    return [];
  }
}

/**
 * Format content for Medium (add title as H1, handle images)
 * @param {string} title - Post title
 * @param {string} text - Post text content
 * @param {string} imageUrl - Optional image URL
 * @returns {string} Formatted markdown content
 */
function formatMediumContent(title, text, imageUrl = null) {
  let content = `# ${title}\n\n`;
  
  if (imageUrl) {
    content += `![Featured Image](${imageUrl})\n\n`;
  }
  
  content += text;
  
  return content;
}

/**
 * Extract title from text (first line or first 60 chars)
 * @param {string} text - Post text
 * @returns {string} Extracted title
 */
function extractTitle(text) {
  if (!text) return 'Untitled Post';
  
  const lines = text.trim().split('\n');
  const firstLine = lines[0].trim();
  
  // If first line is short enough, use it as title
  if (firstLine.length > 0 && firstLine.length <= 100) {
    // Remove markdown heading syntax if present
    return firstLine.replace(/^#{1,6}\s+/, '');
  }
  
  // Otherwise, take first 60 chars
  const title = text.substring(0, 60).trim();
  return title + (text.length > 60 ? '...' : '');
}

/**
 * Extract hashtags from text
 * @param {string} text - Post text
 * @returns {Array} Array of hashtags (without #)
 */
function extractHashtags(text) {
  if (!text) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove # and limit to 3 tags
  return matches.map(tag => tag.substring(1)).slice(0, 3);
}

/**
 * Validate Medium credentials
 * @param {string} accessToken - Access token to validate
 * @returns {Object} Validation result
 */
async function validateMediumToken(accessToken) {
  try {
    await getMediumUserInfo(accessToken);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  postToMedium,
  getMediumUserInfo,
  getMediumPublications,
  formatMediumContent,
  extractTitle,
  extractHashtags,
  validateMediumToken
};

