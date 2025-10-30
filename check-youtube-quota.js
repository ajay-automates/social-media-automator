// Script to help check YouTube quota limits
// Note: This requires manual check in Google Cloud Console
// YouTube Data API doesn't provide a direct way to check quota programmatically

require('dotenv').config();
const axios = require('axios');

console.log('📊 YouTube API Quota Information\n');
console.log('⚠️  Note: YouTube Data API v3 does not provide programmatic quota checking.');
console.log('   You must check quota in Google Cloud Console.\n');

console.log('🔗 Steps to check quota:');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Navigate to: APIs & Services → Quotas');
console.log('3. Filter by: YouTube Data API v3');
console.log('4. Look for: "videos.insert" quota limit\n');

console.log('📋 Default Quota Limits:');
console.log('   - videos.insert: 6 units/day (default)');
console.log('   - This means 6 video uploads per day');
console.log('   - Each upload = 1 unit\n');

console.log('💡 To increase quota:');
console.log('   1. Go to Google Cloud Console');
console.log('   2. APIs & Services → YouTube Data API v3 → Quotas');
console.log('   3. Click "Edit Quotas" or "Request Increase"');
console.log('   4. Request 100-1000 units/day for automation use case\n');

console.log('🔍 Current Environment Check:');
console.log('   YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('   YOUTUBE_CLIENT_SECRET:', process.env.YOUTUBE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');

if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
  console.log('\n⚠️  YouTube credentials not configured in .env file');
} else {
  console.log('\n✅ Credentials configured - you can test uploads when quota is available');
}

console.log('\n📝 Next Steps:');
console.log('   1. Check your quota in Google Cloud Console');
console.log('   2. If at limit, wait until tomorrow or request increase');
console.log('   3. Once quota is available, YouTube posting will work!');


