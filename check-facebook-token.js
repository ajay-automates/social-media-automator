/**
 * Check Facebook Page Token Permissions
 * Run: node check-facebook-token.js
 */

const axios = require('axios');

// Your page token from the logs
const pageToken = process.argv[2] || 'EAAeYdLZBEEHIBP941ZBO5XshjP5Pe34bATPhzwDdohuLByiKbHUuZA1M56J5O7zOU1EZCQ2WGIf1omZCVVxNdcU071CGOHUdoVAmS2t4RmNjNzcR4W8RPj25jisxnv8dHMqorZAxBC3tyL1uZAmLzoiOn5ZBx9CvmbQ9hiKRK54zV0uctkMDafF1NnkPFTVnekEcAL0sfcvq';

async function checkToken() {
  try {
    console.log('🔍 Checking Facebook Page Token Permissions...\n');
    
    // Debug the token
    const debugResponse = await axios.get('https://graph.facebook.com/v18.0/debug_token', {
      params: {
        input_token: pageToken,
        access_token: pageToken
      }
    });
    
    console.log('📋 Token Debug Info:');
    console.log(JSON.stringify(debugResponse.data, null, 2));
    
    const tokenData = debugResponse.data.data;
    console.log(`\n✅ Token is valid: ${tokenData.is_valid}`);
    console.log(`📅 Expires at: ${new Date(tokenData.expires_at * 1000).toISOString()}`);
    console.log(`📋 Scopes: ${tokenData.scopes?.join(', ') || 'N/A'}`);
    console.log(`📋 Granular Scopes:`, tokenData.granular_scopes || 'N/A');
    
    // Try to check what permissions we can use
    console.log(`\n🔍 Checking what permissions this token has...`);
    
    // Try to get page info (basic check)
    try {
      const pageId = tokenData.user_id;
      const pageInfo = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
        params: {
          fields: 'id,name',
          access_token: pageToken
        }
      });
      console.log(`✅ Can read page info: ${pageInfo.data.name}`);
    } catch (err) {
      console.log(`❌ Cannot read page info: ${err.message}`);
    }
    
    // Try to post (this will fail but show what permission is needed)
    console.log(`\n🔍 Testing posting capability...`);
    try {
      const testPost = await axios.post(`https://graph.facebook.com/v18.0/${tokenData.user_id}/feed`, null, {
        params: {
          message: 'Test post - checking permissions',
          access_token: pageToken
        }
      });
      console.log(`✅ Can post! Post ID: ${testPost.data.id}`);
    } catch (err) {
      console.log(`❌ Cannot post:`);
      if (err.response?.data?.error) {
        console.log(`   Error: ${err.response.data.error.message}`);
        console.log(`   Code: ${err.response.data.error.code}`);
        console.log(`   Type: ${err.response.data.error.type}`);
        console.log(`\n💡 Missing Permission: ${err.response.data.error.message}`);
      } else {
        console.log(`   ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking token:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkToken();

