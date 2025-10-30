/**
 * Verification Script for Facebook and Instagram Integration
 * 
 * This script verifies:
 * 1. Code structure and imports
 * 2. Environment variables
 * 3. Credential retrieval
 * 4. Service function signatures
 * 5. Optional: Test actual posting (if userId provided)
 */

require('dotenv').config();
const { getUserCredentialsForPosting } = require('./services/oauth');
const { postToFacebookPage } = require('./services/facebook');
const { postToInstagram } = require('./services/instagram');
const { supabaseAdmin } = require('./services/database');

let verificationResults = {
  codeStructure: {},
  environment: {},
  credentialStructure: {},
  serviceFunctions: {},
  errors: []
};

async function verifyCodeStructure() {
  console.log('\n🔍 Verifying Code Structure...\n');
  
  try {
    // Check Facebook service
    const fbModule = require('./services/facebook');
    verificationResults.codeStructure.facebook = {
      hasPostToFacebookPage: typeof fbModule.postToFacebookPage === 'function',
      hasGetPageInfo: typeof fbModule.getPageInfo === 'function'
    };
    
    // Check Instagram service
    const igModule = require('./services/instagram');
    verificationResults.codeStructure.instagram = {
      hasPostToInstagram: typeof igModule.postToInstagram === 'function',
      hasPollContainerStatus: typeof igModule.pollContainerStatus === 'function'
    };
    
    // Check OAuth service
    const oauthModule = require('./services/oauth');
    verificationResults.codeStructure.oauth = {
      hasGetUserCredentialsForPosting: typeof oauthModule.getUserCredentialsForPosting === 'function',
      hasHandleFacebookCallback: typeof oauthModule.handleFacebookCallback === 'function',
      hasHandleInstagramCallback: typeof oauthModule.handleInstagramCallback === 'function'
    };
    
    console.log('✅ Code structure verified:');
    console.log('   Facebook:', verificationResults.codeStructure.facebook);
    console.log('   Instagram:', verificationResults.codeStructure.instagram);
    console.log('   OAuth:', verificationResults.codeStructure.oauth);
    
  } catch (error) {
    verificationResults.errors.push(`Code structure: ${error.message}`);
    console.error('❌ Code structure verification failed:', error.message);
  }
}

async function verifyEnvironment() {
  console.log('\n🔍 Verifying Environment Variables...\n');
  
  const envCheck = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    FACEBOOK_APP_ID: !!process.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: !!process.env.FACEBOOK_APP_SECRET,
    INSTAGRAM_APP_ID: !!process.env.INSTAGRAM_APP_ID,
    INSTAGRAM_APP_SECRET: !!process.env.INSTAGRAM_APP_SECRET
  };
  
  verificationResults.environment = envCheck;
  
  console.log('📋 Environment Variables:');
  Object.entries(envCheck).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? '✅ Set' : '❌ Missing'}`);
  });
  
  const allSet = Object.values(envCheck).every(v => v);
  if (!allSet) {
    verificationResults.errors.push('Some environment variables are missing');
  }
}

async function verifyCredentialStructure() {
  console.log('\n🔍 Verifying Credential Structure...\n');
  
  try {
    // Get a test userId from database
    const { data: users, error } = await supabaseAdmin
      .from('user_accounts')
      .select('user_id')
      .or('platform.eq.facebook,platform.eq.instagram')
      .limit(1);
    
    if (error) {
      console.warn('⚠️  Could not query database:', error.message);
      verificationResults.errors.push(`Database query: ${error.message}`);
      return;
    }
    
    if (!users || users.length === 0) {
      console.warn('⚠️  No users with Facebook/Instagram accounts found');
      console.log('   This is OK - credentials will be tested when accounts are connected');
      return;
    }
    
    const testUserId = users[0].user_id;
    console.log(`📋 Testing with user: ${testUserId.substring(0, 8)}...`);
    
    const credentials = await getUserCredentialsForPosting(testUserId);
    
    // Verify Facebook credentials structure
    if (credentials.facebook && credentials.facebook.length > 0) {
      const fbAccount = credentials.facebook[0];
      verificationResults.credentialStructure.facebook = {
        hasAccessToken: !!fbAccount.accessToken,
        hasPageId: !!fbAccount.pageId,
        structure: Object.keys(fbAccount)
      };
      console.log('✅ Facebook credentials structure:', verificationResults.credentialStructure.facebook);
    } else {
      console.log('⚠️  No Facebook credentials found for test user');
    }
    
    // Verify Instagram credentials structure
    if (credentials.instagram && credentials.instagram.length > 0) {
      const igAccount = credentials.instagram[0];
      verificationResults.credentialStructure.instagram = {
        hasAccessToken: !!igAccount.accessToken,
        hasIgUserId: !!igAccount.igUserId,
        structure: Object.keys(igAccount)
      };
      console.log('✅ Instagram credentials structure:', verificationResults.credentialStructure.instagram);
    } else {
      console.log('⚠️  No Instagram credentials found for test user');
    }
    
  } catch (error) {
    verificationResults.errors.push(`Credential structure: ${error.message}`);
    console.error('❌ Credential structure verification failed:', error.message);
  }
}

async function verifyServiceFunctions() {
  console.log('\n🔍 Verifying Service Function Signatures...\n');
  
  try {
    // Test Facebook function signature
    const fbFn = require('./services/facebook').postToFacebookPage;
    const fbParams = fbFn.toString().match(/\(([^)]+)\)/)?.[1] || '';
    verificationResults.serviceFunctions.facebook = {
      params: fbParams.split(',').map(p => p.trim()),
      isAsync: fbFn.constructor.name === 'AsyncFunction'
    };
    console.log('✅ Facebook function:', verificationResults.serviceFunctions.facebook);
    
    // Test Instagram function signature
    const igFn = require('./services/instagram').postToInstagram;
    const igParams = igFn.toString().match(/\(([^)]+)\)/)?.[1] || '';
    verificationResults.serviceFunctions.instagram = {
      params: igParams.split(',').map(p => p.trim()),
      isAsync: igFn.constructor.name === 'AsyncFunction'
    };
    console.log('✅ Instagram function:', verificationResults.serviceFunctions.instagram);
    
  } catch (error) {
    verificationResults.errors.push(`Service functions: ${error.message}`);
    console.error('❌ Service function verification failed:', error.message);
  }
}

async function testWithUserId(userId, platform, text, imageUrl) {
  console.log(`\n🧪 Testing ${platform.toUpperCase()} Posting...\n`);
  
  try {
    const credentials = await getUserCredentialsForPosting(userId);
    
    if (platform === 'facebook') {
      if (!credentials.facebook || credentials.facebook.length === 0) {
        console.error('❌ No Facebook accounts found');
        return false;
      }
      
      const account = credentials.facebook[0];
      console.log('📋 Using account:', { pageId: account.pageId });
      
      const result = await postToFacebookPage(text || 'Test post', imageUrl || null, account);
      
      if (result.success) {
        console.log('✅ Facebook post successful!');
        console.log('   Post ID:', result.postId);
        console.log('   URL:', result.url);
        return true;
      } else {
        console.log('❌ Facebook post failed:', result.error);
        return false;
      }
      
    } else if (platform === 'instagram') {
      if (!credentials.instagram || credentials.instagram.length === 0) {
        console.error('❌ No Instagram accounts found');
        return false;
      }
      
      if (!imageUrl) {
        console.error('❌ Instagram requires an imageUrl');
        return false;
      }
      
      const account = credentials.instagram[0];
      console.log('📋 Using account:', { igUserId: account.igUserId });
      
      const result = await postToInstagram(text || 'Test post', imageUrl, account.accessToken, account.igUserId);
      
      if (result.success) {
        console.log('✅ Instagram post successful!');
        console.log('   Post ID:', result.id);
        console.log('   Media Type:', result.mediaType);
        console.log('   URL:', result.url);
        return true;
      } else {
        console.log('❌ Instagram post failed:', result.error);
        if (result.details) {
          console.log('   Details:', JSON.stringify(result.details, null, 2));
        }
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function main() {
  console.log('🚀 Facebook & Instagram Integration Verification\n');
  console.log('='.repeat(60));
  
  // Run verifications
  await verifyCodeStructure();
  await verifyEnvironment();
  await verifyCredentialStructure();
  await verifyServiceFunctions();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY\n');
  
  const allCodeOk = Object.values(verificationResults.codeStructure).every(
    obj => Object.values(obj).every(v => v === true)
  );
  console.log('Code Structure:', allCodeOk ? '✅ All OK' : '⚠️  Issues found');
  
  const allEnvOk = Object.values(verificationResults.environment).every(v => v);
  console.log('Environment:', allEnvOk ? '✅ All Set' : '⚠️  Missing variables');
  
  if (verificationResults.errors.length > 0) {
    console.log('\n⚠️  Errors/Warnings:');
    verificationResults.errors.forEach(err => console.log(`   - ${err}`));
  }
  
  // Optional: Test actual posting if args provided
  const args = process.argv.slice(2);
  if (args.length >= 3) {
    const [platform, userId, text, imageUrl] = args;
    if (['facebook', 'instagram'].includes(platform.toLowerCase())) {
      await testWithUserId(userId, platform.toLowerCase(), text, imageUrl);
    }
  } else {
    console.log('\n💡 To test actual posting, run:');
    console.log('   node verify-facebook-instagram.js facebook <userId> "Test post" [imageUrl]');
    console.log('   node verify-facebook-instagram.js instagram <userId> "Test post" <imageUrl>');
  }
  
  console.log('\n✅ Verification complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

