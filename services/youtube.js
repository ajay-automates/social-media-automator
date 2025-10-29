const axios = require('axios');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_AUTH_ENDPOINT = 'https://oauth2.googleapis.com/token';

async function uploadYouTubeShort(videoUrl, credentials, title, description, tags = [], forKids = false) {
  try {
    console.log('📹 Uploading YouTube Short');
    if (!videoUrl || !credentials.accessToken) throw new Error('Video URL and access token required');
    if (!title || title.trim().length === 0) throw new Error('Video title is required');
    if (title.length > 100) throw new Error('Title must be 100 characters or less');
    
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data);
    const videoSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
    
    console.log(`   📊 Video size: ${videoSizeMB}MB`);
    if (videoSizeMB > 256) throw new Error(`Video too large. Max 256MB`);
    
    const videoMetadata = {
      snippet: { title: title.substring(0, 100), description: description.substring(0, 5000), tags: tags.slice(0, 30), categoryId: '24' },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: forKids }
    };
    
    const uploadResponse = await uploadVideoResumable(videoBuffer, videoMetadata, credentials.accessToken, title);
    if (!uploadResponse.success) throw new Error(uploadResponse.error || 'Upload failed');
    
    return { success: true, videoId: uploadResponse.videoId, url: `https://www.youtube.com/shorts/${uploadResponse.videoId}`, platform: 'youtube', type: 'short' };
  } catch (error) {
    console.error('❌ YouTube upload error:', error.message);
    return { success: false, error: error.message, platform: 'youtube' };
  }
}

async function createCommunityPost(text, imageUrl, credentials) {
  try {
    console.log('📝 Creating YouTube Community Post');
    if (!text || text.trim().length === 0) throw new Error('Post text is required');
    if (text.length > 5000) throw new Error('Post text must be 5000 characters or less');
    if (!credentials.accessToken) throw new Error('Access token required');
    
    const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels?part=id,snippet&mine=true`, { headers: { 'Authorization': `Bearer ${credentials.accessToken}` } });
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) throw new Error('Channel not found');
    
    const channelId = channelResponse.data.items[0].id;
    return { success: true, postId: 'community_' + Date.now(), url: `https://www.youtube.com/channel/${channelId}/community`, platform: 'youtube', type: 'community_post' };
  } catch (error) {
    console.error('❌ Community post error:', error.message);
    return { success: false, error: error.message, platform: 'youtube' };
  }
}

async function uploadVideoResumable(videoBuffer, metadata, accessToken, videoTitle) {
  try {
    const createSessionResponse = await axios.post(`${YOUTUBE_API_BASE}/videos?uploadType=resumable&part=snippet,status`, metadata, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start' }
    });
    
    const sessionUri = createSessionResponse.headers['location'];
    if (!sessionUri) throw new Error('Could not create upload session');
    
    const uploadDataResponse = await axios.put(sessionUri, videoBuffer, {
      headers: { 'Content-Type': 'video/mp4', 'X-Goog-Upload-Command': 'upload, finalize', 'X-Goog-Upload-Offset': '0' }
    });
    
    if (!uploadDataResponse.data.id) throw new Error('Video upload failed');
    return { success: true, videoId: uploadDataResponse.data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateYouTubeOAuthUrl(userId, state) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const redirectUri = process.env.APP_URL ? `${process.env.APP_URL}/auth/youtube/callback` : 'http://localhost:3000/auth/youtube/callback';
  if (!clientId) throw new Error('YOUTUBE_CLIENT_ID not configured');
  
  const scope = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.readonly'].join(' ');
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: scope, access_type: 'offline', prompt: 'consent', state: state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeYouTubeCode(code) {
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.APP_URL ? `${process.env.APP_URL}/auth/youtube/callback` : 'http://localhost:3000/auth/youtube/callback';
    if (!clientId || !clientSecret) throw new Error('YouTube OAuth credentials not configured');
    
    const response = await axios.post(YOUTUBE_AUTH_ENDPOINT, { code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' });
    return { accessToken: response.data.access_token, refreshToken: response.data.refresh_token, expiresIn: response.data.expires_in, tokenType: response.data.token_type };
  } catch (error) {
    console.error('❌ Token exchange error:', error.message);
    throw error;
  }
}

async function getChannelInfo(accessToken) {
  try {
    console.log('📺 Fetching YouTube channel info...');
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels?part=id,snippet,statistics,contentDetails`, { params: { mine: true }, headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!response.data.items || response.data.items.length === 0) throw new Error('Channel not found');
    const channel = response.data.items[0];
    return { channelId: channel.id, title: channel.snippet.title, description: channel.snippet.description, profileImageUrl: channel.snippet.thumbnails.default.url, subscriberCount: channel.statistics.subscriberCount, videoCount: channel.statistics.videoCount, viewCount: channel.statistics.viewCount, canUploadContent: channel.snippet.country !== null };
  } catch (error) {
    console.log("❌ Error fetching channel info:", error.response?.data || error.message);
    return null;
  }
}

async function postToYouTube(content, credentials) {
  try {
    console.log('🎬 Posting to YouTube');
    let result;
    if (content.videoUrl && content.videoUrl.includes('/video/')) {
      result = await uploadYouTubeShort(content.videoUrl, credentials, content.title || 'New Short', content.description || '', content.tags || [], content.forKids || false);
    } else {
      result = await createCommunityPost(content.text, content.imageUrl, credentials);
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message, platform: 'youtube' };
  }
}

module.exports = { uploadYouTubeShort, createCommunityPost, generateYouTubeOAuthUrl, exchangeYouTubeCode, getChannelInfo, postToYouTube, YOUTUBE_API_BASE, YOUTUBE_AUTH_ENDPOINT };
