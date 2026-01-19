const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshTwitterToken(userId, platformUserId) {
  try {
    console.log('🔄 Refreshing Twitter OAuth 2.0 token...');
    
    // Build query - filter by user and platform
    let query = supabaseAdmin
      .from('user_accounts')
      .select('id, refresh_token, platform_user_id')
      .eq('user_id', userId)
      .eq('platform', 'twitter');
    
    // If platform_user_id is provided, filter by it (for multi-account support)
    if (platformUserId) {
      query = query.eq('platform_user_id', platformUserId);
    }
    
    const { data: accounts, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!accounts || accounts.length === 0) {
      throw new Error('Twitter account not found');
    }
    
    // If multiple accounts found and no platform_user_id specified, use the first one
    const account = accounts[0];
    
    if (accounts.length > 1 && !platformUserId) {
      console.log(`⚠️  Multiple Twitter accounts found (${accounts.length}), using first one`);
    }
    
    let oauth2RefreshToken = account.refresh_token;
    let oauth1Credentials = null;
    
    if (account.refresh_token && account.refresh_token.includes(':')) {
      const parts = account.refresh_token.split(':');
      const firstPart = parts[0];
      
      const isOAuth1Format = /^\d+-\w/.test(firstPart);
      
      if (!isOAuth1Format && parts.length >= 3) {
        oauth2RefreshToken = parts[0];
        oauth1Credentials = {
          accessToken: parts[1],
          accessSecret: parts[2]
        };
      } else if (isOAuth1Format) {
        console.log('⚠️  No OAuth 2.0 refresh token found - need to reconnect Twitter');
        throw new Error('Please reconnect your Twitter account for OAuth 2.0');
      }
    }
    
    if (!oauth2RefreshToken) {
      throw new Error('No OAuth 2.0 refresh token available');
    }
    
    console.log('  🔑 Refresh token found, exchanging...');
    
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        refresh_token: oauth2RefreshToken,
        grant_type: 'refresh_token',
        client_id: process.env.TWITTER_CLIENT_ID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
          ).toString('base64')}`
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    console.log('  ✅ New tokens received');
    
    let newRefreshToken = refresh_token || oauth2RefreshToken;
    if (oauth1Credentials) {
      newRefreshToken = `${newRefreshToken}:${oauth1Credentials.accessToken}:${oauth1Credentials.accessSecret}`;
    }
    
    // Update the specific account that was refreshed (use account ID for precision)
    const updateQuery = supabaseAdmin
      .from('user_accounts')
      .update({
        access_token: access_token,
        refresh_token: newRefreshToken,
        token_expires_at: expires_in 
          ? new Date(Date.now() + expires_in * 1000).toISOString()
          : null
      })
      .eq('id', account.id); // Use account ID to update only the specific account
    
    const { error: updateError } = await updateQuery;
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('  ✅ Twitter token refreshed successfully');
    
    return {
      success: true,
      accessToken: access_token
    };
  } catch (error) {
    console.error('❌ Twitter token refresh failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function callTwitterAPIWithRefresh(userId, platformUserId, apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️  Twitter API returned 401, attempting token refresh...');
      
      const refreshResult = await refreshTwitterToken(userId, platformUserId);
      
      if (!refreshResult.success) {
        throw new Error('Token refresh failed: ' + refreshResult.error);
      }
      
      console.log('  🔄 Retrying API call with refreshed token...');
      return await apiCall(refreshResult.accessToken);
    }
    
    throw error;
  }
}

module.exports = {
  refreshTwitterToken,
  callTwitterAPIWithRefresh
};
