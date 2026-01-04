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
  // Use OAuth 1.0a access token if available, otherwise fall back to OAuth 2.0 token
  const oauthToken = credentials.accessTokenOAuth1 || credentials.accessToken;

  const oauthParams = {
    oauth_consumer_key: credentials.apiKey,
    oauth_token: oauthToken,
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
 * Supports both OAuth 2.0 and OAuth 1.0a
 */
async function uploadMediaToTwitter(imageUrl, credentials, isOAuth2 = false) {
  try {
    // Download image from URL
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const base64Image = imageBuffer.toString('base64');

    const url = 'https://upload.twitter.com/1.1/media/upload.json';

    const mediaData = base64Image;

    // Use appropriate auth based on type
    let authHeader;
    let headers;

    // CRITICAL: Twitter media upload v1.1 endpoint REQUIRES OAuth 1.0a
    // OAuth 2.0 bearer token does NOT work for media uploads
    // Check if we have OAuth 1.0a credentials (apiKey, apiSecret, etc.)
    const hasOAuth1 = credentials.apiKey && credentials.apiSecret &&
      credentials.accessTokenOAuth1 && credentials.accessSecret;

    if (hasOAuth1) {
      // OAuth 1.0a: Include media_data in signature
      console.log('  Using OAuth 1.0a for media upload...');
      authHeader = generateOAuthHeader('POST', url, credentials, {
        media_data: mediaData
      });
      headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
    } else {
      // OAuth 2.0: Try with bearer token (likely will fail)
      console.log('  WARNING: Using OAuth 2.0 for media upload (may not work!)');
      console.log('  You need OAuth 1.0a credentials (API Key/Secret) for media uploads');
      authHeader = `Bearer ${credentials.bearerToken || credentials.accessToken}`;
      headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
    }

    // Use URLSearchParams for proper encoding
    const formData = new URLSearchParams();
    formData.append('media_data', mediaData);

    const response = await axios.post(
      url,
      formData.toString(),
      { headers }
    );

    console.log('✅ Twitter: Media uploaded successfully');
    console.log('   Media ID:', response.data.media_id_string);

    return {
      success: true,
      mediaId: response.data.media_id_string
    };
  } catch (error) {
    console.error('❌ Twitter media upload error:', error.response?.data || error.message);
    console.error('❌ Full error response:', JSON.stringify(error.response?.data, null, 2));
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error headers:', error.response?.headers);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Upload VIDEO to Twitter (multi-step upload)
 * Supports both OAuth 2.0 and OAuth 1.0a
 */
async function uploadVideoToTwitter(videoUrl, credentials, isOAuth2 = false) {
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

    // Generate auth header
    let initAuthHeader;
    if (isOAuth2) {
      initAuthHeader = `Bearer ${credentials.bearerToken || credentials.accessToken}`;
    } else {
      initAuthHeader = generateOAuthHeader('POST', initUrl, credentials);
    }

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

      let appendAuthHeader;
      if (isOAuth2) {
        appendAuthHeader = `Bearer ${credentials.bearerToken || credentials.accessToken}`;
      } else {
        appendAuthHeader = generateOAuthHeader('POST', initUrl, credentials, {
          command: 'APPEND',
          media_id: mediaId,
          segment_index: segmentIndex.toString()
        });
      }

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
    let finalizeAuthHeader;
    if (isOAuth2) {
      finalizeAuthHeader = `Bearer ${credentials.bearerToken || credentials.accessToken}`;
    } else {
      finalizeAuthHeader = generateOAuthHeader('POST', initUrl, credentials, {
        command: 'FINALIZE',
        media_id: mediaId
      });
    }

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

    // Wait for processing (only for OAuth 1.0a since OAuth 2.0 doesn't need status check)
    if (!isOAuth2) {
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
    }

    return { success: true, mediaId };

  } catch (error) {
    console.error('❌ Twitter video upload error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Post text to Twitter/X with optional image or video
 * Supports both OAuth 2.0 (bearer token) and OAuth 1.0a credentials
 */
async function postToTwitter(text, credentials, imageUrl = null) {
  try {
    const url = 'https://api.twitter.com/2/tweets';

    const payload = { text };

    // Check if using OAuth 2.0 (bearer token) or OAuth 1.0a
    const isOAuth2 = credentials.bearerToken || (credentials.accessToken && !credentials.apiKey);

    // Upload media if image/video URL provided
    if (imageUrl) {
      console.log('📸 Image URL provided:', imageUrl);
      // Detect video by Cloudinary URL pattern
      const isVideo = imageUrl.includes('/video/') || imageUrl.endsWith('.mp4') || imageUrl.endsWith('.mov');

      if (isVideo) {
        console.log('📹 Uploading video to Twitter...');
        const mediaResult = await uploadVideoToTwitter(imageUrl, credentials, isOAuth2);

        if (mediaResult.success) {
          payload.media = {
            media_ids: [mediaResult.mediaId]
          };
          console.log('✅ Video media ID added to payload:', mediaResult.mediaId);
        } else {
          console.warn('⚠️  Failed to upload video:', mediaResult.error);
          console.warn('⚠️  Posting text only');
        }
      } else {
        console.log('📸 Uploading image to Twitter...');
        const mediaResult = await uploadMediaToTwitter(imageUrl, credentials, isOAuth2);

        if (mediaResult.success) {
          payload.media = {
            media_ids: [mediaResult.mediaId]
          };
          console.log('✅ Image media ID added to payload:', mediaResult.mediaId);
        } else {
          console.warn('⚠️  Failed to upload image:', mediaResult.error);
          console.warn('⚠️  Posting text only');
        }
      }
    }

    // Use OAuth 2.0 bearer token if available, otherwise OAuth 1.0a
    let authHeader;
    if (isOAuth2) {
      authHeader = `Bearer ${credentials.bearerToken || credentials.accessToken}`;
    } else {
      authHeader = generateOAuthHeader('POST', url, credentials);
    }

    console.log('🐦 Twitter API call:');
    console.log('   URL:', url);
    console.log('   Payload:', JSON.stringify(payload, null, 2));
    console.log('   Auth type:', isOAuth2 ? 'OAuth 2.0' : 'OAuth 1.0a');

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
    console.log('   Full response:', JSON.stringify(response.data, null, 2));

    const tweetId = response.data.data.id;
    const postUrl = `https://twitter.com/i/web/status/${tweetId}`;

    return {
      success: true,
      id: tweetId,
      postId: tweetId, // For backward compatibility
      url: postUrl,
      platform: 'twitter'
    };
  } catch (error) {
    console.error('❌ Twitter error:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Message:', error.message);
    let errorMessage = error.response?.data?.detail || error.response?.data?.title || error.message;

    // Handle Rate Limits (429)
    if (error.response?.status === 429) {
      errorMessage = 'Twitter Daily Posting Limit Reached (Rate Limited). Please limit your posts or try again tomorrow.';
    }

    return {
      success: false,
      error: errorMessage,
      platform: 'twitter'
    };
  }
}

module.exports = {
  postToTwitter,
  uploadMediaToTwitter
};
