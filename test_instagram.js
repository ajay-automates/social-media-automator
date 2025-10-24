require('dotenv').config();
const { postToInstagram } = require('./services/instagram');

const credentials = {
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  igUserId: process.env.INSTAGRAM_USER_ID
};

async function test() {
  console.log('🧪 Testing Instagram API...\n');
  console.log('Credentials check:');
  console.log('  Access Token:', credentials.accessToken ? '✅' : '❌');
  console.log('  IG User ID:', credentials.igUserId ? '✅' : '❌');
  
  if (!credentials.accessToken || !credentials.igUserId) {
    console.log('\n❌ Missing Instagram credentials. Please set them in .env file.');
    return;
  }
  
  console.log('\n🚀 Posting test to Instagram...\n');
  
  // Replace with your own public image URL
  const testImageUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';
  const caption = `Testing Instagram automation! 🚀 Built with Node.js\n\n#automation #coding #developer`;
  
  const result = await postToInstagram(
    caption,
    testImageUrl,
    credentials.accessToken,
    credentials.igUserId
  );
  
  console.log('\n📊 Result:', result);
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Check your Instagram profile!');
  } else {
    console.log('\n❌ Failed:', result.error);
  }
}

test();

