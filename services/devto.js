const axios = require('axios');

const DEV_TO_API_BASE = 'https://dev.to/api';

/**
 * Post article to Dev.to
 * @param {string} title - Article title (required)
 * @param {string} body - Article body in Markdown (required)
 * @param {boolean} published - Publish immediately or save as draft (default: true)
 * @param {Array} tags - Array of tags (max 4)
 * @param {string} coverImageUrl - Cover image URL (optional)
 * @param {string} canonicalUrl - Original URL if cross-posting (optional)
 * @param {string} description - Article description/subtitle (optional)
 * @param {Object} credentials - User's Dev.to credentials
 * @returns {Object} Post result with URL and ID
 */
async function postToDevTo(title, body, published = true, tags = [], coverImageUrl = null, canonicalUrl = null, description = null, credentials) {
  try {
    const { apiKey, username } = credentials;

    if (!apiKey) {
      throw new Error('Missing Dev.to API key');
    }

    console.log(`📝 Posting to Dev.to for user @${username}...`);

    // Prepare article data
    const articleData = {
      article: {
        title,
        body_markdown: body,
        published,
        tags: tags.slice(0, 4) // Dev.to allows max 4 tags
      }
    };

    // Add optional fields
    if (coverImageUrl) {
      articleData.article.main_image = coverImageUrl;
    }

    if (canonicalUrl) {
      articleData.article.canonical_url = canonicalUrl;
    }

    if (description) {
      articleData.article.description = description;
    }

    // Make API call
    const response = await axios.post(
      `${DEV_TO_API_BASE}/articles`,
      articleData,
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const article = response.data;

    console.log(`✅ Successfully posted to Dev.to: ${article.url}`);

    return {
      success: true,
      postId: article.id,
      url: article.url,
      published: article.published,
      account: username || 'Dev.to'
    };

  } catch (error) {
    console.error('❌ Error posting to Dev.to:', error.response?.data || error.message);
    
    // Extract error message
    let errorMessage = 'Failed to post to Dev.to';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      account: credentials.username || 'Dev.to'
    };
  }
}

/**
 * Get user's Dev.to profile/info
 * @param {string} apiKey - User's API key
 * @returns {Object} User info
 */
async function getDevToUserInfo(apiKey) {
  try {
    // Get authenticated user's info
    const response = await axios.get(`${DEV_TO_API_BASE}/users/me`, {
      headers: {
        'api-key': apiKey
      }
    });

    const user = response.data;

    console.log(`✅ Retrieved Dev.to user info: @${user.username} (${user.name})`);

    return {
      success: true,
      userId: user.id,
      username: user.username,
      name: user.name,
      profileImage: user.profile_image,
      websiteUrl: user.website_url
    };

  } catch (error) {
    console.error('❌ Error getting Dev.to user info:', error.response?.data || error.message);
    throw new Error('Failed to get Dev.to user info: ' + (error.response?.data?.error || error.message));
  }
}

/**
 * Get user's published articles
 * @param {string} apiKey - User's API key
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Results per page (default: 30, max: 1000)
 * @returns {Array} List of articles
 */
async function getDevToArticles(apiKey, page = 1, perPage = 30) {
  try {
    const response = await axios.get(`${DEV_TO_API_BASE}/articles/me/published`, {
      headers: {
        'api-key': apiKey
      },
      params: {
        page,
        per_page: perPage
      }
    });

    const articles = response.data || [];
    console.log(`✅ Retrieved ${articles.length} Dev.to articles`);

    return articles;

  } catch (error) {
    console.error('⚠️ Error getting Dev.to articles:', error.response?.data || error.message);
    // Don't throw, just return empty array
    return [];
  }
}

/**
 * Format content for Dev.to (Markdown with title and optional image)
 * @param {string} title - Article title
 * @param {string} text - Article text content
 * @param {string} imageUrl - Optional cover image URL
 * @returns {string} Formatted markdown content
 */
function formatDevToContent(title, text, imageUrl = null) {
  let content = `# ${title}\n\n`;
  
  if (imageUrl) {
    content += `![Cover image](${imageUrl})\n\n`;
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
  if (!text) return 'Untitled Article';
  
  const lines = text.trim().split('\n');
  const firstLine = lines[0].trim();
  
  // If first line is short enough, use it as title
  if (firstLine.length > 0 && firstLine.length <= 128) {
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
  
  // Remove # and limit to 4 tags (Dev.to limit)
  return matches.map(tag => tag.substring(1)).slice(0, 4);
}

/**
 * Validate Dev.to API key
 * @param {string} apiKey - API key to validate
 * @returns {Object} Validation result with user info
 */
async function validateDevToApiKey(apiKey) {
  try {
    const userInfo = await getDevToUserInfo(apiKey);
    return { valid: true, user: userInfo };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Create draft article (unpublished)
 * @param {string} title - Article title
 * @param {string} body - Article body
 * @param {Array} tags - Tags array
 * @param {string} coverImageUrl - Cover image URL
 * @param {Object} credentials - User credentials
 * @returns {Object} Post result
 */
async function createDraftArticle(title, body, tags, coverImageUrl, credentials) {
  return postToDevTo(title, body, false, tags, coverImageUrl, null, null, credentials);
}

module.exports = {
  postToDevTo,
  getDevToUserInfo,
  getDevToArticles,
  formatDevToContent,
  extractTitle,
  extractHashtags,
  validateDevToApiKey,
  createDraftArticle
};

