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
 * Post text to Twitter/X
 */
async function postToTwitter(text, credentials) {
  try {
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    
    const authHeader = generateOAuthHeader(method, url, credentials);
    
    const response = await axios.post(
      url,
      { text },
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
  postToTwitter
};
