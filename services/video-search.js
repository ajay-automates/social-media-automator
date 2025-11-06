/**
 * Pexels Video Search Service
 * 100% FREE - Unlimited HD/4K stock videos
 */

const axios = require('axios');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API_URL = 'https://api.pexels.com/videos';

/**
 * Search for videos on Pexels
 * @param {string} query - Search keyword
 * @param {number} perPage - Results per page (max 80)
 * @param {string} orientation - 'portrait', 'landscape', or 'square'
 * @param {number} page - Page number
 * @returns {Promise<Object>} - { videos: [], total: 0, page: 1 }
 */
async function searchVideos(query, perPage = 15, orientation = null, page = 1) {
  try {
    if (!PEXELS_API_KEY) {
      throw new Error('PEXELS_API_KEY not configured. Get free API key from https://www.pexels.com/api/');
    }

    const params = {
      query: query.trim(),
      per_page: Math.min(perPage, 80), // Pexels max is 80
      page: page
    };

    // Add orientation filter if specified
    if (orientation && ['portrait', 'landscape', 'square'].includes(orientation)) {
      params.orientation = orientation;
    }

    console.log(`🎬 Searching Pexels for "${query}" (${orientation || 'any'} orientation)`);

    const response = await axios.get(`${PEXELS_API_URL}/search`, {
      params,
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    const { videos, total_results, page: currentPage, per_page } = response.data;

    // Format videos for easier frontend use
    const formattedVideos = videos.map(video => {
      // Get the best quality video file (prefer HD)
      const hdFile = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
      
      return {
        id: video.id,
        duration: video.duration,
        width: video.width,
        height: video.height,
        url: video.url, // Pexels page URL
        videoUrl: hdFile.link, // Direct video URL
        thumbnail: video.image, // Thumbnail image
        user: video.user?.name || 'Pexels',
        videoFiles: video.video_files.map(f => ({
          quality: f.quality, // 'hd', 'sd', 'uhd'
          width: f.width,
          height: f.height,
          url: f.link,
          fileType: f.file_type
        })),
        orientation: getOrientation(video.width, video.height)
      };
    });

    console.log(`✅ Found ${formattedVideos.length} videos (${total_results} total available)`);

    return {
      videos: formattedVideos,
      total: total_results,
      page: currentPage,
      perPage: per_page,
      hasMore: total_results > (currentPage * per_page)
    };

  } catch (error) {
    console.error('Error searching Pexels videos:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to search videos');
  }
}

/**
 * Get a specific video by ID
 * @param {number} videoId - Pexels video ID
 */
async function getVideoById(videoId) {
  try {
    if (!PEXELS_API_KEY) {
      throw new Error('PEXELS_API_KEY not configured');
    }

    const response = await axios.get(`${PEXELS_API_URL}/videos/${videoId}`, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error getting video by ID:', error);
    throw error;
  }
}

/**
 * Get popular/trending videos
 * @param {number} perPage - Results per page
 */
async function getPopularVideos(perPage = 15) {
  try {
    if (!PEXELS_API_KEY) {
      throw new Error('PEXELS_API_KEY not configured');
    }

    const response = await axios.get(`${PEXELS_API_URL}/popular`, {
      params: { per_page: perPage },
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error getting popular videos:', error);
    throw error;
  }
}

/**
 * Determine video orientation based on dimensions
 */
function getOrientation(width, height) {
  const ratio = width / height;
  
  if (ratio > 1.2) return 'landscape'; // 16:9, 4:3, etc.
  if (ratio < 0.8) return 'portrait'; // 9:16
  return 'square'; // ~1:1
}

/**
 * Get best quality video URL for a specific quality preference
 * @param {Array} videoFiles - Array of video files from Pexels
 * @param {string} preferredQuality - 'hd', 'sd', or 'uhd'
 */
function getBestVideoUrl(videoFiles, preferredQuality = 'hd') {
  // Try to find preferred quality
  const preferred = videoFiles.find(f => f.quality === preferredQuality);
  if (preferred) return preferred.link;
  
  // Fallback to HD
  const hd = videoFiles.find(f => f.quality === 'hd');
  if (hd) return hd.link;
  
  // Fallback to any available
  return videoFiles[0]?.link || null;
}

/**
 * Validate Pexels API key
 */
async function validatePexelsKey() {
  try {
    if (!PEXELS_API_KEY) {
      return { valid: false, error: 'API key not configured' };
    }

    // Test with a simple search
    await axios.get(`${PEXELS_API_URL}/search`, {
      params: { query: 'test', per_page: 1 },
      headers: { 'Authorization': PEXELS_API_KEY }
    });

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.response?.status === 401 ? 'Invalid API key' : error.message 
    };
  }
}

module.exports = {
  searchVideos,
  getVideoById,
  getPopularVideos,
  getOrientation,
  getBestVideoUrl,
  validatePexelsKey
};

