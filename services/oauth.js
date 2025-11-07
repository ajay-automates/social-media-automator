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
// REDDIT OAUTH
// ============================================

/**
 * Initiate Reddit OAuth flow
 * @param {string} userId - User ID from Supabase auth
 * @param {string} redirectUri - Callback URL
 * @returns {string} Authorization URL
 */
function initiateRedditOAuth(userId, redirectUri) {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const scope = 'identity submit read mysubreddits';
  
  if (!clientId) {
    throw new Error('Reddit OAuth not configured. Set REDDIT_CLIENT_ID in environment variables.');
  }
  
  // Generate state parameter for security
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  const authUrl = new URL('https://www.reddit.com/api/v1/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('duration', 'permanent'); // Get refresh_token
  authUrl.searchParams.append('scope', scope);
  
  return authUrl.toString();
}

/**
 * Handle Reddit OAuth callback
 * @param {string} code - Authorization code from Reddit
 * @param {string} state - State parameter (contains userId)
 * @param {string} redirectUri - Callback URL (must match)
 * @returns {object} Account info with moderated subreddits
 */
async function handleRedditCallback(code, state, redirectUri) {
  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    
    // Exchange code for access token (Reddit requires Basic Auth)
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0'
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0'
      }
    });
    
    const profile = profileResponse.data;
    
    // Get moderated subreddits
    const { getModeratedSubreddits } = require('./reddit');
    let moderatedSubreddits = [];
    try {
      moderatedSubreddits = await getModeratedSubreddits(access_token);
    } catch (error) {
      console.log('⚠️  Could not fetch moderated subreddits:', error.message);
    }
    
    // Calculate token expiry (Reddit tokens expire in 1 hour)
    const expiresAt = new Date(Date.now() + (expires_in * 1000));
    
    // Store in database
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'reddit',
        platform_name: 'Reddit',
        oauth_provider: 'reddit',
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: expiresAt.toISOString(),
        platform_user_id: profile.id,
        platform_username: profile.name,
        platform_metadata: JSON.stringify(moderatedSubreddits),
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Reddit account connected for user ${userId} (u/${profile.name})`);
    console.log(`   📋 Moderates ${moderatedSubreddits.length} subreddit(s)`);
    
    return {
      success: true,
      account: {
        id: account.id,
        platform: 'reddit',
        username: profile.name,
        moderatedSubreddits: moderatedSubreddits,
        connected: true
      }
    };
    
  } catch (error) {
    console.error('❌ Reddit OAuth error:', error.response?.data || error.message);
    throw new Error('Failed to connect Reddit account: ' + error.message);
  }
}

/**
 * Refresh Reddit access token
 * Reddit tokens expire in 1 hour, so refresh is required frequently
 * @param {string} refreshToken - Refresh token from database
 * @returns {object} New access token and expiry
 */
async function refreshRedditToken(refreshToken) {
  try {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialMediaAutomator/1.0'
        }
      }
    );
    
    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + (expires_in * 1000));
    
    console.log('✅ Reddit token refreshed');
    
    return {
      access_token,
      expires_at: expiresAt.toISOString()
    };
  } catch (error) {
    console.error('❌ Reddit token refresh error:', error.response?.data || error.message);
    throw new Error('Failed to refresh Reddit token: ' + error.message);
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
  // Instagram uses Facebook Login OAuth flow, not Instagram Basic Display
  // Use the same FACEBOOK_APP_ID (which has Instagram Graph API enabled)
  const clientId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  
  if (!clientId) {
    throw new Error('Instagram OAuth not configured. Set INSTAGRAM_APP_ID or FACEBOOK_APP_ID in environment variables.');
  }
  
  // Generate state parameter for security (store userId in it)
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  // Instagram Business API (2025 - via Facebook Pages)
  // Modern approach: Get Instagram access through Facebook Page permissions
  // The Instagram Business account MUST be linked to a Facebook Page
  // Then use Page token to access Instagram Graph API
  // 
  // Required permissions (no app review needed):
  // - pages_show_list: List your Facebook Pages
  // - business_management: Access business accounts
  //
  // Optional (improves posting, may need review):
  // - pages_read_engagement: Read engagement data
  // - pages_manage_posts: Post to pages (usually auto-granted for page owners)
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'pages_show_list,business_management');
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
    
    // Instagram uses same App ID/Secret as Facebook (same app with Instagram Graph API enabled)
    const clientId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!clientId || !clientSecret) {
      throw new Error('Instagram OAuth not configured. Set INSTAGRAM_APP_ID/INSTAGRAM_APP_SECRET or FACEBOOK_APP_ID/FACEBOOK_APP_SECRET');
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
    
    // Step 6: Store in database (use supabaseAdmin to bypass RLS)
    const { data: account, error } = await supabaseAdmin
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

// ============================================
// FACEBOOK OAUTH
// ============================================

/**
 * Initiate Facebook OAuth flow
 * @param {string} userId - User ID from Supabase auth
 * @returns {string} Authorization URL
 */
function initiateFacebookOAuth(userId) {
  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  
  if (!clientId) {
    throw new Error('Facebook OAuth not configured. Set FACEBOOK_APP_ID in environment variables.');
  }
  
  // Generate state parameter for security (store userId in it)
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  // Facebook OAuth - request permissions for Pages
  // pages_show_list: List pages you manage
  // pages_manage_posts: Post to pages you manage (may require app review for public pages)
  // pages_read_engagement: Read page insights (may require app review)
  // Note: For pages you own, page access token from /me/accounts should have publish permission
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  // Facebook OAuth - request minimal permissions
  // pages_show_list: List pages you manage (only permission that works without app review)
  // Note: Page access tokens from /me/accounts should have publish permissions by default
  // If posting fails, the page token might need explicit permissions or app review
  authUrl.searchParams.append('scope', 'pages_show_list');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);
  
  return authUrl.toString();
}

/**
 * Handle Facebook OAuth callback
 * @param {string} code - Authorization code
 * @param {string} state - State parameter
 * @returns {object} Account info
 */
async function handleFacebookCallback(code, state) {
  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    
    console.log('📘 Facebook OAuth callback for user:', userId);
    
    // Step 1: Exchange code for access token
    console.log('📘 Step 1: Exchanging code for access token...');
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: redirectUri,
          code: code
        }
      }
    );
    
    const userAccessToken = tokenResponse.data.access_token;
    const expiresIn = tokenResponse.data.expires_in || 0;
    
    console.log('✅ Got user access token, expires in:', expiresIn);
    
    // Step 2: Get user's Facebook Pages
    console.log('📘 Step 2: Getting user\'s Facebook Pages...');
    // Request page token with explicit permissions for posting
    // Note: For pages you own, the page token should have publish permissions by default
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,username,picture',
          // Request permissions needed for posting
          // This should grant the page token publishing permissions
        }
      }
    );
    
    console.log('📘 Pages API response:', JSON.stringify(pagesResponse.data, null, 2));
    
    const pages = pagesResponse.data?.data;
    
    if (!pages || pages.length === 0) {
      console.log('⚠️  No pages found in response. Response structure:', {
        hasData: !!pagesResponse.data?.data,
        dataLength: pagesResponse.data?.data?.length,
        fullResponse: pagesResponse.data
      });
      throw new Error('No Facebook Pages found. Please create a Facebook Page first and make sure you are an admin of the page.');
    }
    
    console.log(`✅ Found ${pages.length} Facebook Pages`);
    
    // Save each Page as a separate account
    const savedAccounts = [];
    
    for (const page of pages) {
      // Use page data directly from /me/accounts response
      // No need for extra API call - we already have name, username, etc.
      const pageId = page.id;
      const pageAccessToken = page.access_token;
      const pageName = page.name || 'Facebook Page';
      const pageUsername = page.username || page.name || pageId;
      
      console.log(`📘 Processing page: ${pageName} (ID: ${pageId})`);
      
      // Calculate expiry (use page token expiry or default 60 days)
      const expiresAt = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000));
      
      // Save to database (use supabaseAdmin to bypass RLS for backend operations)
      const { data: account, error } = await supabaseAdmin
        .from('user_accounts')
        .upsert({
          user_id: userId,
          platform: 'facebook',
          platform_name: `Facebook (${pageName})`,
          oauth_provider: 'facebook',
          access_token: pageAccessToken,
          refresh_token: userAccessToken, // Store user token as refresh
          token_expires_at: expiresAt.toISOString(),
          platform_user_id: pageId,
          platform_username: pageUsername,
          status: 'active',
          connected_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform,platform_user_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error saving Facebook Page:', error);
        continue;
      }
      
      savedAccounts.push(account);
      console.log(`✅ Saved Facebook Page: ${pageName}`);
    }
    
    return {
      success: true,
      accounts: savedAccounts,
      connected: true
    };
    
  } catch (error) {
    console.error('❌ Facebook OAuth error:', error.message);
    
    // Log full error details for debugging
    if (error.response) {
      console.error('❌ Facebook API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    // Provide more helpful error messages
    if (error.message.includes('No Facebook Pages')) {
      throw new Error('No Facebook Pages found. Please:\n1. Create a Facebook Page at https://www.facebook.com/pages/create\n2. Make sure you are an admin of the page\n3. Try connecting again');
    }
    
    throw new Error('Failed to connect Facebook account: ' + error.message);
  }
}

/**
 * Get user credentials for posting
 * Returns credentials formatted for the posting services
 * @param {string} userId - User ID
 * @returns {object} Credentials object with linkedin, twitter, instagram, facebook
 */
async function getUserCredentialsForPosting(userId) {
  try {
    // Use supabaseAdmin to bypass RLS
    const { data: accounts, error } = await supabaseAdmin
      .from('user_accounts')
      .select('platform, access_token, refresh_token, platform_user_id, token_expires_at')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) throw error;
    
    // Format credentials for posting services (arrays to support multiple accounts per platform)
    const credentials = {
      linkedin: [],
      twitter: [],
    instagram: [],
    telegram: [],
    slack: [],
    discord: [],
    reddit: [],
    facebook: [],
    youtube: []
    };
    
    accounts?.forEach(account => {
      if (account.platform === 'linkedin') {
        credentials.linkedin.push({
          accessToken: account.access_token,
          urn: account.platform_user_id,
          type: 'person'
        });
      } else if (account.platform === 'twitter') {
        // Twitter: Support both OAuth 2.0 and OAuth 1.0a credentials
        // OAuth 1.0a credentials are stored in additional_credentials field for media uploads
        console.log('🔐 Loading Twitter credentials for user');
        
        const twitterCreds = {
          bearerToken: account.access_token,
          accessToken: account.access_token
        };
        
        // Get OAuth 1.0a API Key and Secret from environment variables (app-level credentials)
        const apiKey = process.env.TWITTER_API_KEY;
        const apiSecret = process.env.TWITTER_API_SECRET;
        
        if (apiKey && apiSecret) {
          twitterCreds.apiKey = apiKey;
          twitterCreds.apiSecret = apiSecret;
          console.log('   ✅ OAuth 1.0a API credentials found from environment - media uploads enabled');
        }
        
        // Debug: Log what we have in refresh_token
        console.log('   🔍 Refresh token preview:', account.refresh_token ? account.refresh_token.substring(0, 50) : 'null');
        console.log('   🔍 Refresh token length:', account.refresh_token ? account.refresh_token.length : 0);
        
        // Check if OAuth 1.0a credentials are available in additional_credentials field
        if (account.additional_credentials) {
          try {
            const additional = typeof account.additional_credentials === 'string' 
              ? JSON.parse(account.additional_credentials) 
              : account.additional_credentials;
            
            if (additional.apiKey && additional.apiSecret) {
              console.log('   ✅ OAuth 1.0a credentials found in additional_credentials - media uploads enabled');
              twitterCreds.apiKey = additional.apiKey;
              twitterCreds.apiSecret = additional.apiSecret;
            }
          } catch (e) {
            console.log('   ⚠️  Failed to parse additional_credentials');
          }
        }
        
        // Check if OAuth 1.0a access token/secret are in refresh_token field
        // Format: access_token:access_secret
        // OAuth 1.0a tokens typically start with numbers (Twitter user ID + dash)
        // OAuth 2.0 refresh tokens are base64-like strings
        if (account.refresh_token && account.refresh_token.includes(':')) {
          try {
            const parts = account.refresh_token.split(':');
            // OAuth 1.0a format: starts with digits followed by dash (e.g., "1981568508711579648-...")
            // OAuth 2.0 refresh token: base64 string (e.g., "b3FqNS1VbTJVcXMt...")
            const firstPart = parts[0];
            const isOAuth1Format = /^\d+-\w/.test(firstPart); // Matches pattern like "1981568508711579648-abc123..."
            
            if (isOAuth1Format && parts.length >= 2) {
              // This is OAuth 1.0a format: access_token:access_secret
              const oauth1AccessToken = parts[0];
              const oauth1AccessSecret = parts.slice(1).join(':'); // Join in case secret contains ':'
              twitterCreds.accessTokenOAuth1 = oauth1AccessToken;
              twitterCreds.accessSecret = oauth1AccessSecret;
              console.log('   ✅ OAuth 1.0a access token found in refresh_token');
            } else {
              console.log('   ⚠️  Refresh token contains OAuth 2.0 token, not OAuth 1.0a');
            }
          } catch (e) {
            console.log('   ⚠️  Failed to parse OAuth 1.0a tokens from refresh_token:', e.message);
          }
        }
        
        if (!twitterCreds.apiKey) {
          console.log('   ⚠️  OAuth 2.0 only - media uploads will fail (missing API Key/Secret)');
        }
        
        if (!twitterCreds.accessTokenOAuth1) {
          console.log('   ⚠️  OAuth 2.0 only - media uploads will fail (missing OAuth 1.0a access token)');
        }
        
        credentials.twitter.push(twitterCreds);
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
      } else if (account.platform === 'slack') {
        credentials.slack.push({
          webhookUrl: account.access_token,
          channelName: account.platform_username
        });
      } else if (account.platform === 'discord') {
        credentials.discord.push({
          webhookUrl: account.access_token,
          serverName: account.platform_username
        });
      } else if (account.platform === 'reddit') {
        credentials.reddit.push({
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          tokenExpiresAt: account.token_expires_at,
          username: account.platform_username,
          moderatedSubreddits: account.platform_metadata ? JSON.parse(account.platform_metadata) : []
        });
      } else if (account.platform === 'facebook') {
        credentials.facebook.push({
          accessToken: account.access_token,
          pageId: account.platform_user_id
        });
      } else if (account.platform === 'youtube') {
        credentials.youtube.push({
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          platform_user_id: account.platform_user_id,
          token_expires_at: account.token_expires_at
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
      telegram: [],
      facebook: []
    };
  }
}

module.exports = {
  // LinkedIn
  initiateLinkedInOAuth,
  handleLinkedInCallback,
  refreshLinkedInToken,
  
  // Reddit
  initiateRedditOAuth,
  handleRedditCallback,
  refreshRedditToken,
  
  // Twitter
  initiateTwitterOAuth,
  handleTwitterCallback,
  
  // Instagram
  initiateInstagramOAuth,
  handleInstagramCallback,
  
  // Facebook
  initiateFacebookOAuth,
  handleFacebookCallback,
  
  // Common
  disconnectAccount,
  disconnectAccountById,
  getUserConnectedAccounts,
  getUserCredentialsForPosting
};

