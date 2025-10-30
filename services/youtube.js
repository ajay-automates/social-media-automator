const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Lazy initialization for token persistence
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
// Check if access token is expired or about to expire
function isTokenExpired(credentials) {
  // If we have a token_expires_at timestamp, check it
  if (credentials.token_expires_at) {
    const expiresAt = new Date(credentials.token_expires_at);
    const now = new Date();
    // Consider expired if less than 5 minutes remaining
    const bufferMs = 5 * 60 * 1000;
    return (expiresAt.getTime() - now.getTime()) < bufferMs;
  }
  // If no expiration info, assume it might be expired after 1 hour
  return false;
}



const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_AUTH_ENDPOINT = 'https://oauth2.googleapis.com/token';

async function refreshYouTubeToken(refreshToken, userId = null) {
  try {
    console.log('🔄 Refreshing YouTube access token...');
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('YouTube OAuth credentials not configured');
    }

    const response = await axios.post(YOUTUBE_AUTH_ENDPOINT, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const newAccessToken = response.data.access_token;
    console.log('✅ Token refreshed successfully');
    
    // Save refreshed token to database
    if (userId && getSupabaseAdmin()) {
      try {
        await getSupabaseAdmin()
          .from('user_accounts')
          .update({ 
            access_token: newAccessToken,
            token_expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString()
          })
          .eq('user_id', userId)
          .eq('platform', 'youtube');
      } catch (dbError) {
        // Non-critical, just log
        console.warn('Could not save refreshed token:', dbError.message);
      }
    }
    
    return {
      accessToken: newAccessToken,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    console.error('❌ Token refresh error:', error.response?.data || error.message);
    throw new Error('Failed to refresh YouTube token');
  }
}

async function uploadYouTubeShort(videoUrl, credentials, title, description, tags = [], forKids = false) {
  try {
    console.log('📹 Uploading YouTube Short');
    
    let accessToken = credentials.accessToken || credentials.access_token;
    const refreshToken = credentials.refreshToken || credentials.refresh_token;
    
    // Check if token is expired or missing
    if (!accessToken && refreshToken) {
      console.log('🔄 No access token, refreshing...');
      const refreshed = await refreshYouTubeToken(refreshToken);
      accessToken = refreshed.accessToken;
    } else if (accessToken && refreshToken && isTokenExpired(credentials)) {
      console.log('🔄 Token expired, refreshing proactively...');
      const refreshed = await refreshYouTubeToken(refreshToken);
      accessToken = refreshed.accessToken;
    }
    
    if (!videoUrl || !accessToken) {
      throw new Error('Video URL and access token required');
    }
    
    if (!title || title.trim().length === 0) {
      throw new Error('Video title is required');
    }
    
    if (title.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }
    
    console.log('📥 Downloading video from Cloudinary...');
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data);
    const videoSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
    
    console.log(`   📊 Video size: ${videoSizeMB}MB`);
    
    if (videoSizeMB > 256) {
      throw new Error(`Video too large (${videoSizeMB}MB). Max 256MB for YouTube Shorts`);
    }
    
    // Ensure #Shorts in title for proper categorization
    let finalTitle = title.substring(0, 93); // Leave room for #Shorts
    if (!finalTitle.toLowerCase().includes('#shorts')) {
      finalTitle = finalTitle + ' #Shorts';
    }
    
    const videoMetadata = {
      snippet: {
        title: finalTitle,
        description: description.substring(0, 5000),
        tags: tags.slice(0, 30),
        categoryId: '22' // People & Blogs - widely compatible
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: forKids
      }
    };
    
    console.log('📤 Starting upload to YouTube...');
    console.log('📋 Final metadata being sent:');
    console.log(JSON.stringify(videoMetadata, null, 2));
    console.log('📊 Video info:');
    console.log('   - Size:', videoSizeMB, 'MB');
    console.log('   - Title length:', finalTitle.length);
    console.log('   - Has #Shorts:', finalTitle.toLowerCase().includes('#shorts'));
    
    // Try upload with current token, retry with refreshed token on 401
    let uploadResponse = await uploadVideoResumable(videoBuffer, videoMetadata, accessToken, title);
    
    // If 401 error and we have refresh token, refresh and retry
    if (!uploadResponse.success && refreshToken) {
      console.log('⚠️  Upload failed, checking if token refresh needed...');
      if (uploadResponse.is401 || (uploadResponse.error && uploadResponse.error.includes('401'))) {
        console.log('🔄 Token expired, refreshing...');
        try {
          const refreshed = await refreshYouTubeToken(refreshToken);
          accessToken = refreshed.accessToken;
          console.log('✅ Token refreshed, retrying upload...');
          uploadResponse = await uploadVideoResumable(videoBuffer, videoMetadata, accessToken, title);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message);
        }
      }
    }
    
    
    if (!uploadResponse.success) {
      throw new Error(uploadResponse.error || 'Upload failed');
    }
    
    console.log(`✅ YouTube Short uploaded: ${uploadResponse.videoId}`);
    
    return {
      success: true,
      videoId: uploadResponse.videoId,
      url: `https://www.youtube.com/shorts/${uploadResponse.videoId}`,
      platform: 'youtube',
      type: 'short'
    };
  } catch (error) {
    console.error('❌ YouTube upload error:', error.message);
    return {
      success: false,
      error: error.message,
      platform: 'youtube'
    };
  }
}

async function uploadVideoResumable(videoBuffer, metadata, accessToken, videoTitle) {
  try {
    const createSessionResponse = await axios.post(
      `${YOUTUBE_API_BASE}/videos?uploadType=resumable&part=snippet,status`,
      metadata,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start'
        }
      }
    );
    
    const sessionUri = createSessionResponse.headers['location'];
    if (!sessionUri) {
      throw new Error('Could not create upload session');
    }
    
    console.log('   📍 Upload session created');
    
    const uploadDataResponse = await axios.put(sessionUri, videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'X-Goog-Upload-Command': 'upload, finalize',
        'X-Goog-Upload-Offset': '0'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    if (!uploadDataResponse.data.id) {
      throw new Error('Video upload failed - no video ID returned');
    }
    
    return {
      success: true,
      videoId: uploadDataResponse.data.id
    };
  } catch (error) {
    const errorCode = error.response?.status || error.response?.data?.error?.code;
    const errorMsg = error.response?.data?.error?.message || error.message;
    const fullError = error.response?.data?.error;
    
    console.error('❌ YouTube upload error:', errorMsg);
    if (errorCode) console.error('   Error code:', errorCode);
    if (fullError?.errors) {
      console.error('   Full error details:', JSON.stringify(fullError.errors, null, 2));
    }
    
    return {
      success: false,
      error: errorMsg,
      errorCode: errorCode,
      is401: errorCode === 401
    };
  }
}

function generateYouTubeOAuthUrl(userId, state) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const redirectUri = process.env.APP_URL
    ? `${process.env.APP_URL}/auth/youtube/callback`
    : 'http://localhost:3000/auth/youtube/callback';
  
  if (!clientId) {
    throw new Error('YOUTUBE_CLIENT_ID not configured');
  }
  
  const scope = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly'
  ].join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeYouTubeCode(code) {
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.APP_URL
      ? `${process.env.APP_URL}/auth/youtube/callback`
      : 'http://localhost:3000/auth/youtube/callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('YouTube OAuth credentials not configured');
    }
    
    const response = await axios.post(YOUTUBE_AUTH_ENDPOINT, {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type
    };
  } catch (error) {
    console.error('❌ Token exchange error:', error.response?.data || error.message);
    throw error;
  }
}

async function getChannelInfo(accessToken) {
  try {
    console.log('📺 Fetching YouTube channel info...');
    
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels?part=id,snippet,statistics,contentDetails`, {
      params: { mine: true },
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Channel not found');
    }
    
    const channel = response.data.items[0];
    
    return {
      channelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      profileImageUrl: channel.snippet.thumbnails.default.url,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      viewCount: channel.statistics.viewCount,
      canUploadContent: channel.snippet.country !== null
    };
  } catch (error) {
    console.log('❌ Error fetching channel info:', error.response?.data || error.message);
    return null;
  }
}

async function postToYouTube(content, credentials) {
  try {
    console.log('🎬 Posting to YouTube');
    console.log('📋 Content:', {
      hasText: !!content.text,
      hasVideo: !!content.videoUrl,
      hasImage: !!content.imageUrl
    });
    console.log('🔑 Credentials:', {
      hasAccessToken: !!(credentials.accessToken || credentials.access_token),
      hasRefreshToken: !!(credentials.refreshToken || credentials.refresh_token)
    });
    
    const videoUrl = content.videoUrl || 
      (content.imageUrl && content.imageUrl.includes('/video/upload/') ? content.imageUrl : null);
    
    if (!videoUrl) {
      console.log('⚠️  No video URL - YouTube only supports video uploads (Shorts)');
      return {
        success: false,
        error: 'YouTube posting requires a video URL. Community Posts not supported via API.',
        platform: 'youtube'
      };
    }
    
    const result = await uploadYouTubeShort(
      videoUrl,
      credentials,
      content.title || content.text?.substring(0, 100) || 'New Short',
      content.description || content.text || '',
      content.tags || [],
      content.forKids || false
    );
    
    return result;
  } catch (error) {
    console.error('❌ YouTube posting error:', error.message);
    return {
      success: false,
      error: error.message,
      platform: 'youtube'
    };
  }
}

module.exports = {
  uploadYouTubeShort,
  generateYouTubeOAuthUrl,
  exchangeYouTubeCode,
  getChannelInfo,
  postToYouTube,
  refreshYouTubeToken,
  YOUTUBE_API_BASE,
  YOUTUBE_AUTH_ENDPOINT
};
