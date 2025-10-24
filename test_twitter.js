require('dotenv').config();
const { postToTwitter } = require('./services/twitter');

const credentials = {
  apiKey: process.env.TWITTER_API_KEY,
  apiSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET
};

async function test() {
  console.log('🧪 Testing Twitter API...\n');
  console.log('Credentials check:');
  console.log('  API Key:', credentials.apiKey ? '✅' : '❌');
  console.log('  API Secret:', credentials.apiSecret ? '✅' : '❌');
  console.log('  Access Token:', credentials.accessToken ? '✅' : '❌');
  console.log('  Access Secret:', credentials.accessSecret ? '✅' : '❌');
  console.log('\n🚀 Posting test tweet...\n');
  
  const result = await postToTwitter(
    'Testing my Twitter automation! 🚀 Built with Node.js #automation #coding',
    credentials
  );
  
  console.log('\n📊 Result:', result);
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Check your Twitter feed!');
    console.log(`https://twitter.com/i/status/${result.id}`);
  } else {
    console.log('\n❌ Failed:', result.error);
  }
}

test();
