const axios = require('axios');
const crypto = require('crypto');

/**
 * Generate OAuth 1.0a signature for Twitter API
 */
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');
  
  return signature;
}

/**
 * Generate OAuth 1.0a header for Twitter API
 */
function generateOAuthHeader(method, url, credentials, additionalParams = {}) {
  const oauthParams = {
    oauth_consumer_key: credentials.apiKey,
    oauth_token: credentials.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(32).toString('base64').replace(/\W/g, ''),
    oauth_version: '1.0'
  };
  
  const allParams = { ...oauthParams, ...additionalParams };
  
  const signature = generateOAuthSignature(
    method,
    url,
    allParams,
    credentials.apiSecret,
    credentials.accessSecret
  );
  
  oauthParams.oauth_signature = signature;
  
  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');
  
  return authHeader;
}

/**
 * Upload IMAGE to Twitter
 */
async function uploadMediaToTwitter(imageUrl, credentials) {
  try {
    // Download image from URL
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const base64Image = imageBuffer.toString('base64');
    
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const method = 'POST';
    
    // IMPORTANT: media_data must be included in OAuth signature
    const mediaData = base64Image;
    const authHeader = generateOAuthHeader(method, url, credentials, {
      media_data: mediaData
    });
    
    const response = await axios.post(
      url,
      `media_data=${encodeURIComponent(mediaData)}`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('✅ Twitter: Media uploaded successfully');
    console.log('   Media ID:', response.data.media_id_string);
    
    return {
      success: true,
      mediaId: response.data.media_id_string
    };
  } catch (error) {
    console.error('❌ Twitter media upload error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Upload VIDEO to Twitter (multi-step upload)
 */
async function uploadVideoToTwitter(videoUrl, credentials) {
  try {
    console.log('📹 Starting video upload to Twitter...');
    
    // Download video from URL
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data);
    const totalBytes = videoBuffer.length;
    
    console.log(`📹 Video size: ${(totalBytes / 1024 / 1024).toFixed(2)}MB`);
    
    // Step 1: INIT upload
    const initUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    
    // Create form data for INIT
    const initFormData = new URLSearchParams({
      command: 'INIT',
      media_type: 'video/mp4',
      total_bytes: totalBytes.toString()
    });
    
    // Generate OAuth header with form parameters
    const initAuthHeader = generateOAuthHeader('POST', initUrl, credentials);
    
    const initResponse = await axios.post(
      initUrl,
      initFormData.toString(),
      {
        headers: {
          'Authorization': initAuthHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const mediaId = initResponse.data.media_id_string;
    console.log(`   📹 Init upload: Media ID ${mediaId}`);
    
    // Step 2: APPEND chunks (Twitter requires 5MB max per chunk)
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    let segmentIndex = 0;
    
    for (let i = 0; i < videoBuffer.length; i += CHUNK_SIZE) {
      const chunk = videoBuffer.slice(i, i + CHUNK_SIZE);
      const chunkBase64 = chunk.toString('base64');
      
      const appendAuthHeader = generateOAuthHeader('POST', initUrl, credentials, {
        command: 'APPEND',
        media_id: mediaId,
        segment_index: segmentIndex.toString()
      });
      
      await axios.post(
        initUrl,
        `command=APPEND&media_id=${mediaId}&segment_index=${segmentIndex}&media=${encodeURIComponent(chunkBase64)}`,
        {
          headers: {
            'Authorization': appendAuthHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log(`   📹 Uploaded chunk ${segmentIndex + 1}`);
      segmentIndex++;
    }
    
    // Step 3: FINALIZE
    const finalizeAuthHeader = generateOAuthHeader('POST', initUrl, credentials, {
      command: 'FINALIZE',
      media_id: mediaId
    });
    
    await axios.post(
      initUrl,
      `command=FINALIZE&media_id=${mediaId}`,
      {
        headers: {
          'Authorization': finalizeAuthHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('✅ Twitter: Video uploaded successfully');
    
    // Wait for processing
    let status = 'processing';
    let attempt = 0;
    while (status === 'processing' && attempt < 10) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusAuthHeader = generateOAuthHeader('GET', `${initUrl}?command=STATUS&media_id=${mediaId}`, credentials);
      const statusResponse = await axios.get(`${initUrl}?command=STATUS&media_id=${mediaId}`, {
        headers: { 'Authorization': statusAuthHeader }
      });
      
      status = statusResponse.data.processing_info.state;
      attempt++;
    }
    
    return { success: true, mediaId };
    
  } catch (error) {
    console.error('❌ Twitter video upload error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Post text to Twitter/X with optional image or video
 */
async function postToTwitter(text, credentials, imageUrl = null) {
  try {
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    
    const payload = { text };
    
    // Upload media if image/video URL provided
    if (imageUrl) {
      // Detect video by Cloudinary URL pattern
      const isVideo = imageUrl.includes('/video/') || imageUrl.endsWith('.mp4') || imageUrl.endsWith('.mov');
      
      if (isVideo) {
        console.log('📹 Uploading video to Twitter...');
        const mediaResult = await uploadVideoToTwitter(imageUrl, credentials);
        
        if (mediaResult.success) {
          payload.media = {
            media_ids: [mediaResult.mediaId]
          };
        } else {
          console.warn('⚠️  Failed to upload video, posting text only');
        }
      } else {
        console.log('📸 Uploading image to Twitter...');
        const mediaResult = await uploadMediaToTwitter(imageUrl, credentials);
        
        if (mediaResult.success) {
          payload.media = {
            media_ids: [mediaResult.mediaId]
          };
        } else {
          console.warn('⚠️  Failed to upload image, posting text only');
        }
      }
    }
    
    const authHeader = generateOAuthHeader(method, url, credentials);
    
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Twitter: Posted successfully');
    console.log('   Tweet ID:', response.data.data.id);
    
    return {
      success: true,
      id: response.data.data.id,
      platform: 'twitter'
    };
  } catch (error) {
    console.error('❌ Twitter error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      platform: 'twitter'
    };
  }
}

module.exports = {
  postToTwitter,
  uploadMediaToTwitter
};
