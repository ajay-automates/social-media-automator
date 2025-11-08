const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

// Lazy Supabase initialization
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseAdmin;
}

// Check if token needs refresh
function isTokenExpired(credentials) {
  if (credentials.token_expires_at) {
    const expiresAt = new Date(credentials.token_expires_at);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 min buffer
    return (expiresAt.getTime() - now.getTime()) < bufferMs;
  }
  return false;
}

// Refresh Pinterest access token
async function refreshPinterestToken(refreshToken, userId) {
  try {
    console.log('🔄 Pinterest: Refreshing token...');
    
    const response = await axios.post('https://api.pinterest.com/v5/oauth/token', 
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.PINTEREST_APP_ID,
        client_secret: process.env.PINTEREST_APP_SECRET
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const newAccessToken = response.data.access_token;
    console.log('✅ Pinterest: Token refreshed successfully');
    
    // Save to database
    if (userId && getSupabaseAdmin()) {
      try {
        await getSupabaseAdmin()
          .from('user_accounts')
          .update({ 
            access_token: newAccessToken,
            token_expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString()
          })
          .eq('user_id', userId)
          .eq('platform', 'pinterest');
        console.log('✅ Pinterest: Token saved to database');
      } catch (dbError) {
        console.warn('⚠️  Could not save refreshed token:', dbError.message);
      }
    }
    
    return {
      accessToken: newAccessToken,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    console.error('❌ Pinterest token refresh error:', error.response?.data || error.message);
    throw new Error('Failed to refresh Pinterest token');
  }
}

// Get user's Pinterest boards
async function getUserBoards(credentials) {
  try {
    let accessToken = credentials.accessToken || credentials.access_token;
    const refreshToken = credentials.refreshToken || credentials.refresh_token;
    const userId = credentials.userId || credentials.user_id;

    // Refresh token if expired
    if (accessToken && refreshToken && isTokenExpired(credentials)) {
      console.log('🔄 Token expired, refreshing...');
      const refreshed = await refreshPinterestToken(refreshToken, userId);
      accessToken = refreshed.accessToken;
    }

    const response = await axios.get(`${PINTEREST_API_BASE}/boards`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Pinterest: Fetched', response.data.items?.length || 0, 'boards');

    return {
      success: true,
      boards: response.data.items.map(board => ({
        id: board.id,
        name: board.name,
        description: board.description,
        privacy: board.privacy
      }))
    };
  } catch (error) {
    console.error('❌ Pinterest boards error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Create a Pin (image + description)
async function createPin(imageUrl, description, credentials, boardId = null, link = null, title = null) {
  try {
    console.log('📍 Creating Pinterest Pin...');
    
    let accessToken = credentials.accessToken || credentials.access_token;
    const refreshToken = credentials.refreshToken || credentials.refresh_token;
    const userId = credentials.userId || credentials.user_id;

    // Refresh token if expired
    if (accessToken && refreshToken && isTokenExpired(credentials)) {
      console.log('🔄 Token expired, refreshing...');
      const refreshed = await refreshPinterestToken(refreshToken, userId);
      accessToken = refreshed.accessToken;
    }

    if (!imageUrl || !description) {
      throw new Error('Image URL and description are required for Pinterest');
    }

    // Pinterest requires title (max 100 chars)
    const pinTitle = title || description.substring(0, 100);

    const pinData = {
      title: pinTitle,
      description: description.substring(0, 500), // Max 500 chars
      media_source: {
        source_type: 'image_url',
        url: imageUrl
      }
    };

    // Optional: Add to specific board
    if (boardId) {
      pinData.board_id = boardId;
    }

    // Optional: Add destination link
    if (link) {
      pinData.link = link;
    }

    console.log('📤 Pinterest: Sending pin data...');
    console.log('   Title:', pinTitle);
    console.log('   Board ID:', boardId || 'default');
    console.log('   Image URL:', imageUrl.substring(0, 50) + '...');

    const response = await axios.post(
      `${PINTEREST_API_BASE}/pins`,
      pinData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Pinterest: Pin created successfully');
    console.log('   Pin ID:', response.data.id);
    
    return {
      success: true,
      id: response.data.id,
      url: response.data.link || `https://www.pinterest.com/pin/${response.data.id}`,
      platform: 'pinterest'
    };
  } catch (error) {
    console.error('❌ Pinterest pin creation error:', error.response?.data || error.message);
    
    // Handle specific errors
    let userFriendlyError = error.message;
    if (error.response?.data?.message?.includes('Invalid media')) {
      userFriendlyError = 'Invalid image URL. Please ensure the image is publicly accessible.';
    } else if (error.response?.data?.message?.includes('rate limit')) {
      userFriendlyError = 'Pinterest rate limit exceeded. Please try again in a few minutes.';
    } else if (error.response?.status === 401) {
      userFriendlyError = 'Pinterest authentication failed. Please reconnect your Pinterest account.';
    }
    
    return {
      success: false,
      error: userFriendlyError,
      platform: 'pinterest'
    };
  }
}

// Main posting function (called by scheduler)
async function postToPinterest(text, imageUrl, credentials, metadata = {}) {
  try {
    console.log('📌 Pinterest: Starting post...');
    
    if (!imageUrl) {
      return {
        success: false,
        error: 'Pinterest requires an image. Please attach an image to post.',
        platform: 'pinterest'
      };
    }

    const result = await createPin(
      imageUrl,
      text,
      credentials,
      metadata.boardId || null,
      metadata.link || null,
      metadata.title || null
    );

    return result;
  } catch (error) {
    console.error('❌ Pinterest posting error:', error.message);
    return {
      success: false,
      error: error.message,
      platform: 'pinterest'
    };
  }
}

module.exports = {
  createPin,
  getUserBoards,
  postToPinterest,
  refreshPinterestToken,
  PINTEREST_API_BASE
};

