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

/**
 * Get user credentials for posting
 * Returns credentials formatted for the posting services
 * @param {string} userId - User ID
 * @returns {object} Credentials object with linkedin, twitter
 */
async function getUserCredentialsForPosting(userId) {
  try {
    // Use supabaseAdmin to bypass RLS
    const { data: accounts, error } = await supabaseAdmin
      .from('user_accounts')
      .select('id, platform, access_token, refresh_token, platform_user_id, platform_username, platform_metadata, token_expires_at')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;

    // Format credentials for posting services (arrays to support multiple accounts per platform)
    const credentials = {
      linkedin: [],
      twitter: [],
      telegram: [],
      slack: [],
      discord: [],
      reddit: [],
      youtube: [],
      pinterest: [],
      medium: [],
      devto: [],
      tumblr: [],
      mastodon: [],
      bluesky: []
    };

    accounts?.forEach(account => {
      if (account.platform === 'linkedin') {
        credentials.linkedin.push({
          id: account.id,
          accessToken: account.access_token,
          urn: account.platform_user_id,
          type: 'person'
        });
      } else if (account.platform === 'twitter') {
        // Twitter: Support both OAuth 2.0 and OAuth 1.0a credentials
        // OAuth 1.0a credentials are stored in additional_credentials field for media uploads
        console.log('🔐 Loading Twitter credentials for user');

        const twitterCreds = {
          id: account.id,
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
      } else if (account.platform === 'telegram') {
        credentials.telegram.push({
          id: account.id,
          botToken: account.access_token,
          chatId: account.platform_user_id
        });
      } else if (account.platform === 'slack') {
        credentials.slack.push({
          id: account.id,
          webhookUrl: account.access_token,
          channelName: account.platform_username
        });
      } else if (account.platform === 'discord') {
        credentials.discord.push({
          id: account.id,
          webhookUrl: account.access_token,
          serverName: account.platform_username
        });
      } else if (account.platform === 'reddit') {
        credentials.reddit.push({
          id: account.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          tokenExpiresAt: account.token_expires_at,
          username: account.platform_username,
          moderatedSubreddits: account.platform_metadata ? JSON.parse(account.platform_metadata) : []
        });
      } else if (account.platform === 'youtube') {
        credentials.youtube.push({
          id: account.id,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          platform_user_id: account.platform_user_id,
          token_expires_at: account.token_expires_at
        });
      } else if (account.platform === 'pinterest') {
        credentials.pinterest.push({
          id: account.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          userId: account.user_id,
          username: account.platform_username,
          token_expires_at: account.token_expires_at
        });
      } else if (account.platform === 'medium') {
        credentials.medium.push({
          id: account.id,
          accessToken: account.access_token,
          userId: account.platform_user_id,
          username: account.platform_username
        });
      } else if (account.platform === 'devto') {
        credentials.devto.push({
          id: account.id,
          apiKey: account.access_token,
          username: account.platform_username
        });
      } else if (account.platform === 'tumblr') {
        const metadata = account.platform_metadata ? JSON.parse(account.platform_metadata) : {};
        const blogName = metadata.blogName || account.platform_username;

        credentials.tumblr.push({
          id: account.id,
          accessToken: account.access_token,
          accessTokenSecret: account.refresh_token, // Token secret stored as refresh_token
          blogName: blogName,
          blogTitle: metadata.blogTitle || blogName,
          allBlogs: metadata.allBlogs || []
        });
      } else if (account.platform === 'mastodon') {
        const metadata = account.platform_metadata ? JSON.parse(account.platform_metadata) : {};
        credentials.mastodon.push({
          id: account.id,
          accessToken: account.access_token,
          instanceUrl: metadata.instanceUrl || 'https://mastodon.social',
          username: account.platform_username
        });
      } else if (account.platform === 'bluesky') {
        const metadata = account.platform_metadata ? JSON.parse(account.platform_metadata) : {};
        credentials.bluesky.push({
          id: account.id,
          accessJwt: account.access_token,
          refreshJwt: account.refresh_token,
          did: account.platform_user_id,
          handle: account.platform_username
        });
      }
    });

    return credentials;

  } catch (error) {
    console.error('❌ Error fetching user credentials for posting:', error.message);
    return {
      linkedin: [],
      twitter: [],
      telegram: [],
      youtube: [],
      pinterest: []
    };
  }
}

// ============================================
// PINTEREST OAUTH
// ============================================

function initiatePinterestOAuth(userId, redirectUri) {
  const clientId = process.env.PINTEREST_APP_ID;
  const scope = 'boards:read,boards:write,pins:read,pins:write,user_accounts:read';

  if (!clientId) {
    throw new Error('Pinterest OAuth not configured. Set PINTEREST_APP_ID in environment variables.');
  }

  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

  const authUrl = new URL('https://www.pinterest.com/oauth/');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('state', state);

  return authUrl.toString();
}

async function handlePinterestCallback(code, state, redirectUri) {
  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for token
    const tokenResponse = await axios.post('https://api.pinterest.com/v5/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.PINTEREST_APP_ID,
        client_secret: process.env.PINTEREST_APP_SECRET
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const profile = profileResponse.data;

    // Store in database
    const { data, error } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'pinterest',
        platform_user_id: profile.username,
        platform_username: profile.username,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        platform_metadata: JSON.stringify({
          profile_image: profile.profile_image,
          account_type: profile.account_type
        })
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) throw error;

    return {
      success: true,
      username: profile.username,
      platform: 'pinterest'
    };
  } catch (error) {
    console.error('Pinterest OAuth callback error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// TUMBLR OAUTH (OAuth 1.0a)
// ============================================

/**
 * Initiate Tumblr OAuth flow
 * @param {string} userId - User ID from Supabase auth
 * @param {string} redirectUri - Callback URL
 * @returns {Object} Authorization URL and request token secret (to store temporarily)
 */
async function initiateTumblrOAuth(userId, redirectUri) {
  try {
    const { getRequestToken } = require('./tumblr');

    if (!process.env.TUMBLR_CONSUMER_KEY) {
      throw new Error('Tumblr OAuth not configured. Set TUMBLR_CONSUMER_KEY in environment variables.');
    }

    // Step 1: Get request token
    const { requestToken, requestTokenSecret } = await getRequestToken(redirectUri);

    // Store request token secret temporarily (needed for step 3)
    // We'll use the oauth_states table for temporary storage
    await supabaseAdmin
      .from('oauth_states')
      .insert({
        state: requestToken,
        code_verifier: requestTokenSecret, // Store token secret here
        user_id: userId,
        platform: 'tumblr',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    // Step 2: Build authorization URL
    const authUrl = `https://www.tumblr.com/oauth/authorize?oauth_token=${requestToken}`;

    console.log('✅ Tumblr OAuth flow initiated');

    return {
      authUrl,
      requestToken
    };

  } catch (error) {
    console.error('❌ Error initiating Tumblr OAuth:', error);
    throw error;
  }
}

/**
 * Handle Tumblr OAuth callback
 * @param {string} oauthToken - Request token from callback
 * @param {string} oauthVerifier - Verifier from callback
 * @returns {object} Account info
 */
async function handleTumblrCallback(oauthToken, oauthVerifier) {
  try {
    console.log('🔄 Processing Tumblr OAuth callback...');

    // Get stored request token secret
    const { data: stateRecord, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('user_id, code_verifier')
      .eq('state', oauthToken)
      .eq('platform', 'tumblr')
      .single();

    if (stateError || !stateRecord) {
      console.error('OAuth state lookup error:', stateError);
      throw new Error('Invalid or expired OAuth state');
    }

    const userId = stateRecord.user_id;
    const requestTokenSecret = stateRecord.code_verifier;

    // Delete the temporary state
    await supabaseAdmin
      .from('oauth_states')
      .delete()
      .eq('state', oauthToken);

    // Step 3: Exchange for access token
    const { getAccessToken, getTumblrUserInfo } = require('./tumblr');
    const { accessToken, accessTokenSecret } = await getAccessToken(
      oauthToken,
      requestTokenSecret,
      oauthVerifier
    );

    // Get user info and blogs
    const userInfo = await getTumblrUserInfo(accessToken, accessTokenSecret);

    // Store in database
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'tumblr',
        platform_name: 'Tumblr',
        oauth_provider: 'tumblr',
        access_token: accessToken,
        refresh_token: accessTokenSecret, // Store token secret as refresh_token
        platform_user_id: userInfo.primaryBlog.uuid,
        platform_username: userInfo.primaryBlog.name,
        platform_metadata: JSON.stringify({
          blogName: userInfo.primaryBlog.name,
          blogTitle: userInfo.primaryBlog.title,
          blogUrl: userInfo.primaryBlog.url,
          allBlogs: userInfo.blogs.map(b => ({ name: b.name, title: b.title, url: b.url }))
        }),
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Tumblr credentials:', error);
      throw error;
    }

    console.log(`✅ Tumblr connected successfully for user ${userId}: ${userInfo.primaryBlog.name}`);

    return {
      success: true,
      accountId: account.id,
      blogName: userInfo.primaryBlog.name,
      blogTitle: userInfo.primaryBlog.title,
      platform: 'tumblr'
    };

  } catch (error) {
    console.error('❌ Tumblr OAuth callback error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// MEDIUM OAUTH
// ============================================

/**
 * Initiate Medium OAuth flow
 * @param {string} userId - User ID from Supabase auth
 * @param {string} redirectUri - Callback URL
 * @returns {string} Authorization URL
 */
function initiateMediumOAuth(userId, redirectUri) {
  const clientId = process.env.MEDIUM_CLIENT_ID;
  const scope = 'basicProfile,publishPost';

  if (!clientId) {
    throw new Error('Medium OAuth not configured. Set MEDIUM_CLIENT_ID in environment variables.');
  }

  // Generate state parameter for security
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

  const authUrl = new URL('https://medium.com/m/oauth/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);

  return authUrl.toString();
}

/**
 * Handle Medium OAuth callback
 * Exchange authorization code for access token and store in database
 * @param {string} code - Authorization code from Medium
 * @param {string} state - State parameter (contains userId)
 * @param {string} redirectUri - Callback URL (must match)
 * @returns {object} Account info
 */
async function handleMediumCallback(code, state, redirectUri) {
  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    console.log(`🔄 Processing Medium OAuth callback for user ${userId}...`);

    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      code,
      client_id: process.env.MEDIUM_CLIENT_ID,
      client_secret: process.env.MEDIUM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const tokenResponse = await axios.post(
      'https://api.medium.com/v1/tokens',
      tokenParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const { access_token, refresh_token, expires_at } = tokenResponse.data;

    // Get Medium user info
    const { getMediumUserInfo } = require('./medium');
    const userInfo = await getMediumUserInfo(access_token);

    // Calculate token expiry (Medium tokens don't expire but store expires_at if provided)
    const expiresAt = expires_at ? new Date(expires_at * 1000).toISOString() : null;

    // Store in database
    const { data: account, error } = await supabase
      .from('user_accounts')
      .upsert({
        user_id: userId,
        platform: 'medium',
        platform_name: 'Medium',
        oauth_provider: 'medium',
        access_token: access_token,
        refresh_token: refresh_token || null,
        token_expires_at: expiresAt,
        platform_user_id: userInfo.userId,
        platform_username: userInfo.username,
        status: 'active',
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,platform_user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Medium credentials:', error);
      throw error;
    }

    console.log(`✅ Medium connected successfully for user ${userId}: @${userInfo.username}`);

    return {
      success: true,
      accountId: account.id,
      userId: userInfo.userId,
      username: userInfo.username,
      name: userInfo.name,
      platform: 'medium'
    };

  } catch (error) {
    console.error('❌ Medium OAuth callback error:', error.response?.data || error.message);
    throw error;
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

  // Pinterest
  initiatePinterestOAuth,
  handlePinterestCallback,

  // Medium
  initiateMediumOAuth,
  handleMediumCallback,

  // Tumblr
  initiateTumblrOAuth,
  handleTumblrCallback,

  // Common
  disconnectAccount,
  disconnectAccountById,
  getUserConnectedAccounts,
  getUserCredentialsForPosting
};

