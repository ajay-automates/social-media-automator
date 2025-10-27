/**
 * OAuth Service
 * Handles OAuth flows for social media platforms (LinkedIn, Twitter)
 */

const crypto = require('crypto');
const axios = require('axios');
const { supabase, supabaseAdmin } = require('./database');

// ============================================
// LINKEDIN OAUTH
// ============================================

/**
 * Initiate LinkedIn OAuth flow
 * @param {string} userId - User ID from Supabase auth
 * @param {string} redirectUri - Callback URL
 * @returns {string} Authorization URL
 */
function initiateLinkedInOAuth(userId, redirectUri) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const scope = 'openid profile email w_member_social';
  
  if (!clientId) {
    throw new Error('LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID in environment variables.');
  }
  
  // Generate state parameter for security (store userId in it)
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('state', state);
  
  return authUrl.toString();
}

/**
 * Handle LinkedIn OAuth callback
 * Exchange authorization code for access token and store in database
 * @param {string} code - Authorization code from LinkedIn
 * @param {string} state - State parameter (contains userId)
 * @param {string} redirectUri - Callback URL (must match)
 * @returns {object} Account info
 */
async function handleLinkedInCallback(code, state, redirectUri) {
  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: redirectUri
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const profile = profileResponse.data;
    
    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (expires_in * 1000));
    
    // Store in database
    const { data: account, error } = await supabase
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'linkedin',
        platform_name: 'LinkedIn',
        oauth_provider: 'linkedin',
        access_token: access_token,
        token_expires_at: expiresAt.toISOString(),
        platform_user_id: profile.sub,
        platform_username: profile.name || profile.email,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ LinkedIn account connected for user ${userId}`);
    
    return {
      success: true,
      account: {
        id: account.id,
        platform: 'linkedin',
        username: profile.name,
        connected: true
      }
    };
    
  } catch (error) {
    console.error('❌ LinkedIn OAuth error:', error.message);
    throw new Error('Failed to connect LinkedIn account: ' + error.message);
  }
}

/**
 * Refresh LinkedIn access token
 * LinkedIn tokens typically last 60 days, this function refreshes them
 * @param {number} accountId - Account ID from user_accounts table
 * @returns {object} Updated account info
 */
async function refreshLinkedInToken(accountId) {
  try {
    // Get account from database
    const { data: account, error: fetchError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('platform', 'linkedin')
      .single();
    
    if (fetchError) throw fetchError;
    
    // LinkedIn doesn't support refresh tokens in the standard OAuth flow
    // Instead, we need to re-authenticate when token expires
    // Mark the account as expired
    const { error: updateError } = await supabase
      .from('user_accounts')
      .update({
        status: 'expired'
      })
      .eq('id', accountId);
    
    if (updateError) throw updateError;
    
    return {
      success: false,
      message: 'LinkedIn token expired. Please reconnect your account.'
    };
    
  } catch (error) {
    console.error('❌ Error refreshing LinkedIn token:', error.message);
    throw error;
  }
}

// ============================================
// TWITTER OAUTH (OAuth 1.0a)
// ============================================

/**
 * Initiate Twitter OAuth flow
 * Twitter uses OAuth 1.0a which requires a request token first
 * @param {string} userId - User ID from Supabase auth
 * @param {string} callbackUrl - Callback URL
 * @returns {object} { authUrl: string, oauthToken: string }
 */
async function initiateTwitterOAuth(userId, callbackUrl) {
  try {
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('Twitter OAuth not configured. Set TWITTER_API_KEY and TWITTER_API_SECRET in environment variables.');
    }
    
    // Step 1: Get request token
    const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
    
    // Generate OAuth 1.0a signature
    const oauthParams = {
      oauth_callback: callbackUrl,
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0'
    };
    
    // Create signature base string
    const signatureBase = createSignatureBase('POST', requestTokenUrl, oauthParams);
    const signingKey = `${encodeURIComponent(consumerSecret)}&`;
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');
    
    oauthParams.oauth_signature = signature;
    
    // Create Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');
    
    // Request token
    const response = await axios.post(requestTokenUrl, null, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Parse response
    const params = new URLSearchParams(response.data);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');
    
    // Store token secret temporarily (in real production, use Redis or similar)
    // For now, we'll include it in the authorization URL as a parameter
    // Note: This is simplified for the MVP - in production use proper storage
    
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;
    
    return {
      success: true,
      authUrl,
      oauthToken,
      oauthTokenSecret  // Return this to be stored temporarily
    };
    
  } catch (error) {
    console.error('❌ Twitter OAuth initiation error:', error.message);
    throw new Error('Failed to initiate Twitter OAuth: ' + error.message);
  }
}

/**
 * Handle Twitter OAuth callback
 * Exchange request token for access token
 * @param {string} oauthToken - OAuth token from callback
 * @param {string} oauthVerifier - OAuth verifier from callback
 * @param {string} userId - User ID
 * @param {string} oauthTokenSecret - Token secret from initiation step
 * @returns {object} Account info
 */
async function handleTwitterCallback(oauthToken, oauthVerifier, userId, oauthTokenSecret) {
  try {
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    // Step 2: Exchange for access token
    const accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
    
    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: oauthToken,
      oauth_version: '1.0'
    };
    
    // Create signature
    const signatureBase = createSignatureBase('POST', accessTokenUrl, { ...oauthParams, oauth_verifier: oauthVerifier });
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(oauthTokenSecret)}`;
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');
    
    oauthParams.oauth_signature = signature;
    
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');
    
    // Get access token
    const response = await axios.post(accessTokenUrl, `oauth_verifier=${oauthVerifier}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const params = new URLSearchParams(response.data);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');
    const screenName = params.get('screen_name');
    const twitterUserId = params.get('user_id');
    
    // Store in database
    const { data: account, error } = await supabase
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'twitter',
        platform_name: 'Twitter/X',
        oauth_provider: 'twitter',
        access_token: accessToken,
        refresh_token: accessTokenSecret,  // Store token secret here
        platform_user_id: twitterUserId,
        platform_username: screenName,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Twitter account connected for user ${userId}`);
    
    return {
      success: true,
      account: {
        id: account.id,
        platform: 'twitter',
        username: screenName,
        connected: true
      }
    };
    
  } catch (error) {
    console.error('❌ Twitter OAuth error:', error.message);
    throw new Error('Failed to connect Twitter account: ' + error.message);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create OAuth 1.0a signature base string
 * @param {string} method - HTTP method (GET, POST)
 * @param {string} url - Request URL
 * @param {object} params - OAuth parameters
 * @returns {string} Signature base string
 */
function createSignatureBase(method, url, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  return [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');
}

/**
 * Disconnect a social media account (all accounts for the platform)
 * @param {string} userId - User ID
 * @param {string} platform - Platform to disconnect
 * @returns {object} Result
 */
async function disconnectAccount(userId, platform) {
  try {
    // Use supabaseAdmin to bypass RLS for backend operations
    const { error } = await supabaseAdmin
      .from('user_accounts')
      .update({ status: 'disconnected' })
      .eq('user_id', userId)
      .eq('platform', platform);
    
    if (error) throw error;
    
    console.log(`✅ ${platform} account(s) disconnected for user ${userId}`);
    
    return {
      success: true,
      message: `${platform} account(s) disconnected successfully`
    };
    
  } catch (error) {
    console.error(`❌ Error disconnecting ${platform}:`, error.message);
    throw error;
  }
}

/**
 * Disconnect a specific account by ID
 * @param {string} userId - User ID
 * @param {number} accountId - Account ID to disconnect
 * @returns {object} Result
 */
async function disconnectAccountById(userId, accountId) {
  try {
    // Use supabaseAdmin to bypass RLS for backend operations
    const { error } = await supabaseAdmin
      .from('user_accounts')
      .update({ status: 'disconnected' })
      .eq('id', accountId)
      .eq('user_id', userId); // Ensure user owns this account
    
    if (error) throw error;
    
    console.log(`✅ Account ${accountId} disconnected for user ${userId}`);
    
    return {
      success: true,
      message: 'Account disconnected successfully'
    };
    
  } catch (error) {
    console.error(`❌ Error disconnecting account ${accountId}:`, error.message);
    throw error;
  }
}

/**
 * Get all connected accounts for a user
 * @param {string} userId - User ID
 * @returns {array} List of connected accounts
 */
async function getUserConnectedAccounts(userId) {
  try {
    // Use supabaseAdmin to bypass RLS for backend queries
    const { data: accounts, error } = await supabaseAdmin
      .from('user_accounts')
      .select('id, platform, platform_name, platform_username, status, connected_at')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) throw error;
    
    return accounts || [];
    
  } catch (error) {
    console.error('❌ Error fetching connected accounts:', error.message);
    return [];
  }
}

// ============================================
// INSTAGRAM OAUTH
// ============================================

/**
 * Initiate Instagram OAuth flow
 * @param {string} userId - User ID from Supabase auth
 * @returns {string} Authorization URL
 */
function initiateInstagramOAuth(userId) {
  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  
  if (!clientId) {
    throw new Error('Instagram OAuth not configured. Set INSTAGRAM_APP_ID in environment variables.');
  }
  
  // Generate state parameter for security (store userId in it)
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  // Instagram Graph API via Facebook Login - required for posting
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'pages_show_list,pages_read_engagement,instagram_content_publish,business_management');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);
  
  return authUrl.toString();
}

/**
 * Handle Instagram OAuth callback
 * Exchange authorization code for access token and store in database
 * @param {string} code - Authorization code from Instagram
 * @param {string} state - State parameter (contains userId)
 * @returns {object} Account info
 */
async function handleInstagramCallback(code, state) {
  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    const clientId = process.env.INSTAGRAM_APP_ID;
    const clientSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!clientId || !clientSecret) {
      throw new Error('Instagram OAuth not configured');
    }
    
    // Step 1: Exchange code for access token (Facebook Graph API)
    console.log('📱 Step 1: Exchanging code for access token...');
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    const expiresIn = tokenResponse.data.expires_in || 5184000; // Default 60 days if not provided
    
    // Step 2: Get Facebook Pages (to find Instagram Business Account)
    console.log('📱 Step 2: Getting Facebook Pages...');
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: {
          access_token: accessToken
        }
      }
    );
    
    const pages = pagesResponse.data.data;
    if (!pages || pages.length === 0) {
      throw new Error('No Facebook Pages found. Instagram Business account must be linked to a Facebook Page.');
    }
    
    // Step 3: Get Instagram Business Account ID from first page
    console.log('📱 Step 3: Getting Instagram Business Account ID...');
    const pageId = pages[0].id;
    const pageToken = pages[0].access_token;
    
    const igBusinessResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}`,
      {
        params: {
          fields: 'instagram_business_account',
          access_token: pageToken
        }
      }
    );
    
    const igBusinessId = igBusinessResponse.data.instagram_business_account?.id;
    if (!igBusinessId) {
      throw new Error('Instagram Business or Creator account not found. Please link your Instagram account to a Facebook Page.');
    }
    
    // Step 4: Get Instagram username
    console.log('📱 Step 4: Getting Instagram username...');
    const usernameResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${igBusinessId}`,
      {
        params: {
          fields: 'username',
          access_token: accessToken
        }
      }
    );
    
    const username = usernameResponse.data.username;
    
    // Step 5: Calculate token expiry
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));
    
    // Step 6: Store in database
    const { data: account, error } = await supabase
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'instagram',
        platform_name: 'Instagram',
        oauth_provider: 'instagram',
        access_token: accessToken,
        token_expires_at: expiresAt.toISOString(),
        platform_user_id: igBusinessId,
        platform_username: username,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Instagram account connected for user ${userId}`);
    
    return {
      success: true,
      account: {
        id: account.id,
        platform: 'instagram',
        username: username,
        connected: true
      }
    };
    
  } catch (error) {
    console.error('❌ Instagram OAuth error:', error.message);
    throw new Error('Failed to connect Instagram account: ' + error.message);
  }
}

/**
 * Get user credentials for posting
 * Returns credentials formatted for the posting services
 * @param {string} userId - User ID
 * @returns {object} Credentials object with linkedin, twitter, instagram
 */
async function getUserCredentialsForPosting(userId) {
  try {
    // Use supabaseAdmin to bypass RLS
    const { data: accounts, error } = await supabaseAdmin
      .from('user_accounts')
      .select('platform, access_token, refresh_token, platform_user_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) throw error;
    
    // Format credentials for posting services (arrays to support multiple accounts per platform)
    const credentials = {
      linkedin: [],
      twitter: [],
      instagram: [],
      telegram: []
    };
    
    accounts?.forEach(account => {
      if (account.platform === 'linkedin') {
        credentials.linkedin.push({
          accessToken: account.access_token,
          urn: account.platform_user_id,
          type: 'person'
        });
      } else if (account.platform === 'twitter') {
        // Twitter: Use OAuth 2.0 credentials from database (multi-tenant safe)
        // Each user's Twitter account has its own access token from the database
        console.log('🔐 Loading Twitter credentials for user');
        console.log('   Using OAuth 2.0 from database');
        
        credentials.twitter.push({
          bearerToken: account.access_token,
          accessToken: account.access_token
        });
      } else if (account.platform === 'instagram') {
        credentials.instagram.push({
          accessToken: account.access_token,
          igUserId: account.platform_user_id
        });
      } else if (account.platform === 'telegram') {
        credentials.telegram.push({
          botToken: account.access_token,
          chatId: account.platform_user_id
        });
      }
    });
    
    return credentials;
    
  } catch (error) {
    console.error('❌ Error fetching user credentials for posting:', error.message);
    return {
      linkedin: [],
      twitter: [],
      instagram: [],
      telegram: []
    };
  }
}

module.exports = {
  // LinkedIn
  initiateLinkedInOAuth,
  handleLinkedInCallback,
  refreshLinkedInToken,
  
  // Twitter
  initiateTwitterOAuth,
  handleTwitterCallback,
  
  // Instagram
  initiateInstagramOAuth,
  handleInstagramCallback,
  
  // Common
  disconnectAccount,
  disconnectAccountById,
  getUserConnectedAccounts,
  getUserCredentialsForPosting
};

