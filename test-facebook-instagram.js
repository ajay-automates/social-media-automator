/**
 * Test Script for Facebook and Instagram Posting
 * 
 * Usage:
 *   node test-facebook-instagram.js [platform] [userId] [text] [imageUrl]
 * 
 * Examples:
 *   node test-facebook-instagram.js facebook <userId> "Test post" https://example.com/image.jpg
 *   node test-facebook-instagram.js instagram <userId> "Test post" https://example.com/image.jpg
 */

require('dotenv').config();
const { getUserCredentialsForPosting } = require('./services/oauth');
const { postToFacebookPage } = require('./services/facebook');
const { postToInstagram } = require('./services/instagram');

async function testFacebook(userId, text, imageUrl) {
  console.log('\n📘 Testing Facebook Posting...\n');
  
  try {
    // Get credentials
    const credentials = await getUserCredentialsForPosting(userId);
    console.log('📋 Credentials:', {
      facebookAccounts: credentials.facebook?.length || 0,
      hasFacebook: credentials.facebook && credentials.facebook.length > 0
    });
    
    if (!credentials.facebook || credentials.facebook.length === 0) {
      console.error('❌ No Facebook accounts found for user');
      return;
    }
    
    const account = credentials.facebook[0];
    console.log('📋 Using account:', {
      pageId: account.pageId,
      hasAccessToken: !!account.accessToken
    });
    
    // Post to Facebook
    console.log('\n📤 Posting to Facebook...');
    const result = await postToFacebookPage(text, imageUrl || null, account);
    
    console.log('\n✅ Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 Facebook post successful!');
      console.log('   Post ID:', result.postId);
      console.log('   URL:', result.url);
    } else {
      console.log('\n❌ Facebook post failed:');
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

async function testInstagram(userId, text, imageUrl) {
  console.log('\n📸 Testing Instagram Posting...\n');
  
  try {
    // Get credentials
    const credentials = await getUserCredentialsForPosting(userId);
    console.log('📋 Credentials:', {
      instagramAccounts: credentials.instagram?.length || 0,
      hasInstagram: credentials.instagram && credentials.instagram.length > 0
    });
    
    if (!credentials.instagram || credentials.instagram.length === 0) {
      console.error('❌ No Instagram accounts found for user');
      return;
    }
    
    const account = credentials.instagram[0];
    console.log('📋 Using account:', {
      igUserId: account.igUserId,
      hasAccessToken: !!account.accessToken
    });
    
    if (!imageUrl) {
      console.error('❌ Instagram requires a media URL');
      return;
    }
    
    // Post to Instagram
    console.log('\n📤 Posting to Instagram...');
    const result = await postToInstagram(text, imageUrl, account.accessToken, account.igUserId);
    
    console.log('\n✅ Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 Instagram post successful!');
      console.log('   Post ID:', result.id);
      console.log('   Media Type:', result.mediaType);
      console.log('   URL:', result.url);
    } else {
      console.log('\n❌ Instagram post failed:');
      console.log('   Error:', result.error);
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const platform = args[0]?.toLowerCase();
  const userId = args[1];
  const text = args[2] || 'Test post from automation tool';
  const imageUrl = args[3];
  
  // Validate arguments
  if (!platform || !['facebook', 'instagram'].includes(platform)) {
    console.error('❌ Usage: node test-facebook-instagram.js [facebook|instagram] [userId] [text] [imageUrl]');
    process.exit(1);
  }
  
  if (!userId) {
    console.error('❌ User ID is required');
    console.error('   Usage: node test-facebook-instagram.js [platform] [userId] [text] [imageUrl]');
    process.exit(1);
  }
  
  if (platform === 'instagram' && !imageUrl) {
    console.error('❌ Instagram requires an imageUrl');
    console.error('   Usage: node test-facebook-instagram.js instagram [userId] [text] [imageUrl]');
    process.exit(1);
  }
  
  // Check environment variables
  console.log('🔍 Environment Check:');
  if (platform === 'facebook') {
    console.log('   FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? '✓ Set' : '✗ Missing');
  } else {
    console.log('   INSTAGRAM_APP_ID:', process.env.INSTAGRAM_APP_ID ? '✓ Set' : '✗ Missing');
    console.log('   INSTAGRAM_APP_SECRET:', process.env.INSTAGRAM_APP_SECRET ? '✓ Set' : '✗ Missing');
  }
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');
  
  // Run test
  if (platform === 'facebook') {
    await testFacebook(userId, text, imageUrl);
  } else {
    await testInstagram(userId, text, imageUrl);
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

