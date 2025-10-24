require('dotenv').config();
const { postToTwitter } = require('./services/twitter');

const credentials = {
  apiKey: process.env.TWITTER_API_KEY,
  apiSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET
};

async function test() {
  const uniqueText = `Twitter automation test ${Date.now()} 🚀 #automation`;
  
  console.log('🐦 Posting unique tweet...\n');
  
  const result = await postToTwitter(uniqueText, credentials);
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Tweet posted!');
    console.log(`https://twitter.com/i/web/status/${result.id}`);
  } else {
    console.log('\n❌ Failed:', result.error);
  }
}

test();
