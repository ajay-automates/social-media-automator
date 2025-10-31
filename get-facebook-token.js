/**
 * Script to get Facebook access token from database
 * Run: node get-facebook-token.js
 */

require('dotenv').config();
const { supabaseAdmin } = require('./services/database');

async function getFacebookToken() {
  try {
    // Replace with your user ID
    const userId = process.argv[2] || 'ad14450a-b2da-4fe4-98f3-269f4a4fa2e5';
    
    console.log('🔍 Looking for Facebook tokens for user:', userId);
    
    const { data: accounts, error } = await supabaseAdmin
      .from('user_accounts')
      .select('platform, access_token, platform_user_id, platform_name, platform_username')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .eq('status', 'active');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No Facebook accounts found');
      return;
    }
    
    console.log(`\n✅ Found ${accounts.length} Facebook account(s):\n`);
    
    accounts.forEach((account, index) => {
      console.log(`--- Facebook Account ${index + 1} ---`);
      console.log(`Page Name: ${account.platform_name}`);
      console.log(`Page Username: ${account.platform_username || 'N/A'}`);
      console.log(`Page ID: ${account.platform_user_id}`);
      console.log(`Access Token: ${account.access_token}`);
      console.log(`\nTo check token permissions:`);
      console.log(`1. Go to: https://developers.facebook.com/tools/debug/accesstoken/`);
      console.log(`2. Paste this token: ${account.access_token}`);
      console.log(`3. Click "Debug" to see permissions\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getFacebookToken();

