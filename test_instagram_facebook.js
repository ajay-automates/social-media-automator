/**
 * Test Instagram and Facebook Posting
 * 
 * This script tests the integration by posting to both platforms
 * 
 * Usage:
 *   node test_instagram_facebook.js
 */

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { postToInstagram } = require('./services/instagram');
const { postToFacebookPage } = require('./services/facebook');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test image URL (publicly accessible)
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';

async function testInstagram() {
  console.log('\n📱 Testing Instagram Posting...\n');

  try {
    // Get a test Instagram account from database
    const { data: accounts, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('platform', 'instagram')
      .eq('status', 'active')
      .limit(1);

    if (error) {
      throw error;
    }

    if (!accounts || accounts.length === 0) {
      console.log('❌ No Instagram accounts found in database');
      console.log('   Please connect an Instagram account first via the dashboard');
      return null;
    }

    const account = accounts[0];
    console.log('✅ Found Instagram account:', account.platform_username);
    console.log('   Access Token:', account.access_token.substring(0, 20) + '...');
    console.log('   IG User ID:', account.platform_user_id);

    const caption = '🧪 Test post from Social Media Automator\n\nThis is a test of the Instagram integration! #automation #instagram';

    console.log('\n📤 Posting to Instagram...');
    const result = await postToInstagram(caption, TEST_IMAGE_URL, account.access_token, account.platform_user_id);

    if (result.success) {
      console.log('✅ Instagram test successful!');
      console.log('   Post ID:', result.id);
      console.log('   Media Type:', result.mediaType);
      return result;
    } else {
      console.log('❌ Instagram test failed:', result.error);
      return null;
    }

  } catch (error) {
    console.error('❌ Instagram test error:', error.message);
    if (error.response?.data) {
      console.error('   API Response:', error.response.data);
    }
    return null;
  }
}

async function testFacebook() {
  console.log('\n📘 Testing Facebook Posting...\n');

  try {
    // Get a test Facebook Page from database
    const { data: accounts, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('status', 'active')
      .limit(1);

    if (error) {
      throw error;
    }

    if (!accounts || accounts.length === 0) {
      console.log('❌ No Facebook Pages found in database');
      console.log('   Please connect a Facebook Page first via the dashboard');
      return null;
    }

    const account = accounts[0];
    console.log('✅ Found Facebook Page:', account.platform_name);
    console.log('   Page ID:', account.platform_user_id);
    console.log('   Access Token:', account.access_token.substring(0, 20) + '...');

    // Test 1: Text-only post
    console.log('\n📤 Test 1: Posting text-only to Facebook...');
    const textResult = await postToFacebookPage(
      '🧪 Test post from Social Media Automator\n\nThis is a test of the Facebook integration! #automation',
      null,
      {
        pageId: account.platform_user_id,
        accessToken: account.access_token
      }
    );

    if (textResult.success) {
      console.log('✅ Facebook text-only test successful!');
      console.log('   Post ID:', textResult.postId);
    } else {
      console.log('❌ Facebook text-only test failed');
    }

    // Test 2: Image post
    console.log('\n📤 Test 2: Posting image to Facebook...');
    const imageResult = await postToFacebookPage(
      '🧪 Image test post from Social Media Automator\n\nThis is a test with an image! #automation',
      TEST_IMAGE_URL,
      {
        pageId: account.platform_user_id,
        accessToken: account.access_token
      }
    );

    if (imageResult.success) {
      console.log('✅ Facebook image test successful!');
      console.log('   Post ID:', imageResult.postId);
      console.log('   Permalink:', imageResult.permalink);
      return imageResult;
    } else {
      console.log('❌ Facebook image test failed');
      return null;
    }

  } catch (error) {
    console.error('❌ Facebook test error:', error.message);
    if (error.response?.data) {
      console.error('   API Response:', error.response.data);
    }
    return null;
  }
}

async function runTests() {
  console.log('🧪 Instagram & Facebook Integration Test');
  console.log('=' .repeat(50));

  // Check environment variables
  console.log('\n📋 Environment Check:');
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

  // Run tests
  const igResult = await testInstagram();
  const fbResult = await testFacebook();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  console.log('Instagram:', igResult ? '✅ PASSED' : '❌ FAILED');
  console.log('Facebook:', fbResult ? '✅ PASSED' : '❌ FAILED');

  if (igResult || fbResult) {
    console.log('\n🎉 At least one test passed! Check your social media profiles.');
  } else {
    console.log('\n⚠️  No tests passed. Please check:');
    console.log('   1. Instagram account is connected in dashboard');
    console.log('   2. Facebook Page is connected in dashboard');
    console.log('   3. Access tokens are valid (not expired)');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
