const axios = require('axios');

async function refreshLinkedInToken(refreshToken) {
  try {
    console.log('🔄 LinkedIn: Refreshing access token...');
    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({grant_type: 'refresh_token',refresh_token: refreshToken,client_id: process.env.LINKEDIN_CLIENT_ID,client_secret: process.env.LINKEDIN_CLIENT_SECRET}), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);
    console.log('✅ LinkedIn: Token refreshed successfully');
    return {access_token: response.data.access_token,refresh_token: response.data.refresh_token || refreshToken,expires_in: response.data.expires_in,expires_at: expiresAt};
  } catch (error) {
    console.error('❌ LinkedIn: Token refresh failed:', error.response?.data || error.message);
    throw new Error('LinkedIn token refresh failed');
  }
}

async function ensureValidToken(credentials) {
  if (!credentials.token_expires_at) {
    return credentials;
  }
  const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tokenExpiry = new Date(credentials.token_expires_at);
  if (tokenExpiry <= expiryThreshold) {
    console.log('⚠️  LinkedIn: Token expiring soon, refreshing...');
    try {
      const newToken = await refreshLinkedInToken(credentials.refresh_token);
      const { supabaseAdmin } = require('./database');
      await supabaseAdmin.from('user_accounts').update({access_token: newToken.access_token,refresh_token: newToken.refresh_token,token_expires_at: newToken.expires_at.toISOString(),updated_at: new Date().toISOString()}).eq('id', credentials.id).eq('platform', 'linkedin');
      console.log('✅ LinkedIn: Token refreshed and updated in database');
      return {...credentials,access_token: newToken.access_token,refresh_token: newToken.refresh_token,token_expires_at: newToken.expires_at.toISOString()};
    } catch (error) {
      console.error('❌ Failed to refresh LinkedIn token:', error.message);
      return credentials;
    }
  }
  return credentials;
}

async function postTextToLinkedIn(text, accessToken, urn, type = 'person') {
  try {
    let author;
    if (!urn || urn === '') {author = 'urn:li:person:me';} else {author = type === 'organization' ? 'urn:li:organization:' + urn : 'urn:li:person:' + urn;}
    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts',{author: author,lifecycleState: 'PUBLISHED',specificContent: {'com.linkedin.ugc.ShareContent': {shareCommentary: {text: text},shareMediaCategory: 'NONE'}},visibility: {'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'}},{headers: {'Authorization': 'Bearer ' + accessToken,'Content-Type': 'application/json','X-Restli-Protocol-Version': '2.0.0'}});
    console.log('✅ LinkedIn: Posted successfully');
    const postUrl = 'https://www.linkedin.com/feed/update/' + response.data.id;
    return {success: true,id: response.data.id,url: postUrl,platform: 'linkedin'};
  } catch (error) {
    console.error('❌ LinkedIn error:', error.response?.data || error.message);
    return {success: false,error: error.response?.data?.message || error.message,platform: 'linkedin'};
  }
}

async function postImageToLinkedIn(text, imageUrl, accessToken, urn, type = 'person') {
  try {
    let author;
    if (!urn || urn === '') {author = 'urn:li:person:me';} else {author = type === 'organization' ? 'urn:li:organization:' + urn : 'urn:li:person:' + urn;}
    const registerResponse = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload',{registerUploadRequest: {recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],owner: author,serviceRelationships: [{relationshipType: 'OWNER',identifier: 'urn:li:userGeneratedContent'}]}},{headers: {'Authorization': 'Bearer ' + accessToken,'Content-Type': 'application/json','X-Restli-Protocol-Version': '2.0.0'}});
    const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResponse.data.value.asset;
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    await axios.put(uploadUrl, imageData.data, {headers: {'Authorization': 'Bearer ' + accessToken,'Content-Type': 'application/octet-stream'}});
    const postResponse = await axios.post('https://api.linkedin.com/v2/ugcPosts',{author: author,lifecycleState: 'PUBLISHED',specificContent: {'com.linkedin.ugc.ShareContent': {shareCommentary: {text: text},shareMediaCategory: 'IMAGE',media: [{status: 'READY',description: {text: 'Image'},media: asset,title: {text: 'Post Image'}}]}},visibility: {'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'}},{headers: {'Authorization': 'Bearer ' + accessToken,'Content-Type': 'application/json','X-Restli-Protocol-Version': '2.0.0'}});
    console.log('✅ LinkedIn: Posted image successfully');
    const postUrl = 'https://www.linkedin.com/feed/update/' + postResponse.data.id;
    return {success: true,id: postResponse.data.id,url: postUrl,platform: 'linkedin'};
  } catch (error) {
    console.error('❌ LinkedIn image post error:', error.response?.data || error.message);
    return {success: false,error: error.response?.data?.message || error.message,platform: 'linkedin'};
  }
}

async function postToLinkedIn(text, imageUrl, credentials) {
  try {
    const validCredentials = await ensureValidToken(credentials);
    if (imageUrl) {
      return await postImageToLinkedIn(text, imageUrl, validCredentials.access_token || validCredentials.accessToken, validCredentials.urn, validCredentials.type);
    } else {
      return await postTextToLinkedIn(text, validCredentials.access_token || validCredentials.accessToken, validCredentials.urn, validCredentials.type);
    }
  } catch (error) {
    console.error('❌ LinkedIn posting error:', error.message);
    return {success: false,error: error.message,platform: 'linkedin'};
  }
}

module.exports = {postTextToLinkedIn,postImageToLinkedIn,postToLinkedIn,refreshLinkedInToken,ensureValidToken};
