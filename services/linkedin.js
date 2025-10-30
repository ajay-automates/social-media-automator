const axios = require('axios');

async function postTextToLinkedIn(text, accessToken, urn, type = 'person') {
  try {
    // Use special 'me' identifier for personal posts without URN
    let author;
    if (!urn || urn === '') {
      author = 'urn:li:person:me';
    } else {
      author = type === 'organization' ? `urn:li:organization:${urn}` : `urn:li:person:${urn}`;
    }
    
    console.log('Posting with author:', author);
    
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
    
    // Extract post ID from LinkedIn URN format (e.g., "urn:li:ugcPost:123456")
    const postId = response.data.id.split(':').pop();
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;
    
    return { 
      success: true, 
      id: response.data.id,
      postId: postId, // Extracted numeric ID for URL construction
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

async function postImageToLinkedIn(text, imageUrl, accessToken, urn, type = 'person') {
  try {
    let author;
    if (!urn || urn === '') {
      author = 'urn:li:person:me';
    } else {
      author = type === 'organization' ? `urn:li:organization:${urn}` : `urn:li:person:${urn}`;
    }
    
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
    
    // Extract post ID from LinkedIn URN format (e.g., "urn:li:ugcPost:123456")
    const postId = postResponse.data.id.split(':').pop();
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;
    
    return { 
      success: true, 
      id: postResponse.data.id,
      postId: postId, // Extracted numeric ID for URL construction
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

module.exports = {
  postTextToLinkedIn,
  postImageToLinkedIn
};
