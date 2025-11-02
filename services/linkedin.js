const axios = require('axios');

/**
 * Refresh LinkedIn access token using refresh token
 * @param {string} refreshToken - LinkedIn refresh token
 * @returns {Promise<object>} - New token data
 */
async function refreshLinkedInToken(refreshToken) {
  try {
    console.log('🔄 LinkedIn: Refreshing access token...');
    
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

    console.log('✅ LinkedIn: Token refreshed successfully');
    console.log(`   New token expires at: ${expiresAt.toISOString()}`);
    
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || refreshToken,
      expires_in: response.data.expires_in,
      expires_at: expiresAt
    };
  } catch (error) {
    console.error('❌ LinkedIn: Token refresh failed:', error.response?.data || error.message);
    throw new Error(`LinkedIn token refresh failed: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Check if LinkedIn token needs refresh (proactively refresh 1 day before expiry)
 * @param {object} credentials - Account credentials
 * @returns {Promise<object>} - Updated credentials
 */
async function ensureValidToken(credentials) {
  if (!credentials.token_expires_at) {
    console.log('⚠️  LinkedIn: No token expiry date, assuming valid');
    return credentials;
  }

  const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tokenExpiry = new Date(credentials.token_expires_at);

  if (tokenExpiry <= expiryThreshold) {
    console.log('⚠️  LinkedIn: Token expiring soon, refreshing...');
    console.log(`   Current expiry: ${credentials.token_expires_at}`);
    
    try {
      const newToken = await refreshLinkedInToken(credentials.refresh_token);
      
      const { supabaseAdmin } = require('./database');
      const { error } = await supabaseAdmin
        .from('user_accounts')
        .update({
          access_token: newToken.access_token,
          refresh_token: newToken.refresh_token,
          token_expires_at: newToken.expires_at.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', credentials.id)
        .eq('platform', 'linkedin');
      
      if (error) {
        console.error('❌ Failed to update token in database:', error);
      } else {
        console.log('✅ LinkedIn: Token refreshed and updated in database');
      }
      
      return {
        ...credentials,
        access_token: newToken.access_token,
        refresh_token: newToken.refresh_token,
        token_expires_at: newToken.expires_at.toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to refresh LinkedIn token:', error.message);
      return credentials;
    }
  }

  return credentials;
}

/**
 * Post text-only content to LinkedIn
 */
async function postTextToLinkedIn(text, accessToken, urn, type = 'person') {
  try {
    let author;
    if (!urn || urn === '') {
      author = 'urn:li:person:me';
    } else {
      author = type === 'organization' ? `urn:li:organization:${urn}` : `urn:li:person:${urn}`;
    }
    
    console.log('📝 LinkedIn: Posting with author:', author);
    
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    console.log('✅ LinkedIn: Posted successfully');
    console.log('   Post ID:', response.data.id);
    
    const postId = response.data.id.split(':').pop();
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;
    
    return {
      success: true,
      id: response.data.id,
      postId: postId,
      url: postUrl,
      platform: 'linkedin'
    };
  } catch (error) {
    console.error('❌ LinkedIn error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data,
      platform: 'linkedin'
    };
  }
}

/**
 * Post image with text to LinkedIn
 */
async function postImageToLinkedIn(text, imageUrl, accessToken, urn, type = 'person') {
  try {
    let author;
    if (!urn || urn === '') {
      author = 'urn:li:person:me';
    } else {
      author = type === 'organization' ? `urn:li:organization:${urn}` : `urn:li:person:${urn}`;
    }
    
    console.log('📸 LinkedIn: Posting image with author:', author);
    
    const registerResponse = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: author,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResponse.data.value.asset;
    
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    await axios.put(uploadUrl, imageData.data, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      }
    });
    
    console.log('✅ LinkedIn: Image uploaded successfully');
    
    const postResponse = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                description: {
                  text: 'Image'
                },
                media: asset,
                title: {
                  text: 'Post Image'
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    console.log('✅ LinkedIn: Posted image successfully');
    
    const postId = postResponse.data.id.split(':').pop();
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;
    
    return {
      success: true,
      id: postResponse.data.id,
      postId: postId,
      url: postUrl,
      platform: 'linkedin'
    };
  } catch (error) {
    console.error('❌ LinkedIn image post error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      platform: 'linkedin'
    };
  }
}

/**
 * Post to LinkedIn with automatic token refresh
 * @param {string} text - Post text
 * @param {string} imageUrl - Optional image URL
 * @param {object} credentials - Account credentials object
 * @returns {Promise<object>} - Result object
 */
async function postToLinkedIn(text, imageUrl, credentials) {
  try {
    const validCredentials = await ensureValidToken(credentials);
    
    if (imageUrl) {
      return await postImageToLinkedIn(
        text, 
        imageUrl, 
        validCredentials.access_token || validCredentials.accessToken, 
        validCredentials.urn, 
        validCredentials.type
      );
    } else {
      return await postTextToLinkedIn(
        text, 
        validCredentials.access_token || validCredentials.accessToken, 
        validCredentials.urn, 
        validCredentials.type
      );
    }
  } catch (error) {
    console.error('❌ LinkedIn posting error:', error.message);
    return {
      success: false,
      error: error.message,
      platform: 'linkedin'
    };
  }
}

module.exports = {
  postTextToLinkedIn,
  postImageToLinkedIn,
  postToLinkedIn,
  refreshLinkedInToken,
  ensureValidToken
};
