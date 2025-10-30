// Test YouTube integration locally
require('dotenv').config();
const { postToYouTube } = require('./services/youtube');
const { getUserCredentialsForPosting } = require('./services/oauth');

async function testYouTube() {
  try {
    console.log('🧪 Testing YouTube Integration...\n');
    
    // Check environment variables
    console.log('📋 Environment Check:');
    console.log('  YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? '✓ Set' : '✗ Missing');
    console.log('  YOUTUBE_CLIENT_SECRET:', process.env.YOUTUBE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
    console.log('  APP_URL:', process.env.APP_URL || 'Not set (will use localhost)');
    console.log('');
    
    // Test with a sample user ID (replace with actual user ID for real test)
    const testUserId = process.argv[2];
    if (!testUserId) {
      console.log('\n❌ Please provide a valid user ID (UUID)');
      console.log('   Usage: node test-youtube.js <user-id> [video-url]');
      console.log('   Example: node test-youtube.js 123e4567-e89b-12d3-a456-426614174000');
      return;
    }
    console.log(`🔍 Loading credentials for user: ${testUserId}`);
    
    const credentials = await getUserCredentialsForPosting(testUserId);
    console.log('📊 Credentials loaded:');
    console.log(`  YouTube accounts: ${credentials.youtube.length}`);
    
    if (credentials.youtube.length === 0) {
      console.log('\n❌ No YouTube accounts connected!');
      console.log('   Steps to connect:');
      console.log('   1. Go to Settings page');
      console.log('   2. Click "Connect YouTube" button');
      console.log('   3. Authorize the app');
      return;
    }
    
    console.log('\n✅ YouTube account found:');
    credentials.youtube.forEach((acc, idx) => {
      console.log(`  Account ${idx + 1}:`);
      console.log(`    Platform User ID: ${acc.platform_user_id}`);
      console.log(`    Has Access Token: ${!!acc.access_token}`);
      console.log(`    Has Refresh Token: ${!!acc.refresh_token}`);
      console.log(`    Token Expires At: ${acc.token_expires_at || 'Not set'}`);
    });
    
    // Test with a sample video URL
    const testVideoUrl = process.argv[3];
    if (!testVideoUrl) {
      console.log('\n⚠️  No video URL provided - will test credential loading only');
      console.log('   Usage: node test-youtube.js <user-id> <video-url>');
      console.log('   Example: node test-youtube.js <user-id> https://res.cloudinary.com/.../video/upload/v123/test.mp4');
      return;
    }
    console.log(`\n📹 Test Video URL: ${testVideoUrl}`);
    
    if (!testVideoUrl.includes('/video/')) {
      console.log('⚠️  Test video URL does not contain /video/ pattern');
      console.log('   Using test URL anyway for credential testing...');
    }
    
    console.log('\n🧪 Testing postToYouTube function...');
    const testContent = {
      text: 'Test YouTube Short',
      videoUrl: testVideoUrl,
      title: 'Test YouTube Short',
      description: 'This is a test video upload',
      tags: [],
      type: 'short'
    };
    
    const account = credentials.youtube[0];
    const ytCredentials = {
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      token_expires_at: account.token_expires_at
    };
    
    console.log('📤 Sending test request...');
    const result = await postToYouTube(testContent, ytCredentials);
    
    console.log('\n📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ YouTube test PASSED!');
      console.log(`   Video ID: ${result.videoId}`);
      console.log(`   URL: ${result.url}`);
    } else {
      console.log('\n❌ YouTube test FAILED!');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testYouTube();

