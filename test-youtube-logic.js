require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { postToYouTube } = require('./services/youtube');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const USER_ID = 'ad14450a-b2da-4fe4-98f3-269f4a4fa2e5';

// Simulate the frontend sending a video URL as imageUrl
const MOCK_IMAGE_URL = 'https://res.cloudinary.com/demo/video/upload/dog.mp4';
const MOCK_TEXT = 'Test Video Upload';

async function testLogic() {
    console.log('🚀 Testing Scheduler Logic for YouTube...');

    // 1. Get Credentials
    const { data: accounts } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('platform', 'youtube');

    if (!accounts || accounts.length === 0) {
        console.error('❌ No YouTube account found.');
        return;
    }
    const account = accounts[0];

    // 2. Simulate Scheduler Logic
    // Arguments passed to postNow in server.js:
    // postNow(text, finalImageUrl, platforms, credentials, post_metadata, !!variations, videoUrl || null)

    // Scenario: User uploaded video manually.
    // imageUrl = MOCK_IMAGE_URL
    // videoUrl (arg) = null

    const imageUrl = MOCK_IMAGE_URL;
    const videoUrlArg = null;

    // Logic from scheduler.js
    let image_url = videoUrlArg || imageUrl; // Prioritize video over image

    console.log('1️⃣  image_url resolved to:', image_url);

    // Detection Logic
    console.log('    🔍 Checking YouTube video URL:', image_url);
    const isVideo = image_url && (
        image_url.includes('/video/upload/') ||
        image_url.includes('/video/') ||
        image_url.match(/\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i)
    );

    const videoUrl = isVideo ? image_url : null;
    console.log('2️⃣  Detected videoUrl:', videoUrl);

    if (!videoUrl) {
        console.log('❌ Logic failed: Video not detected.');
        return;
    }

    // 3. Attempt Post
    console.log('3️⃣  Attempting postToYouTube...');

    const content = {
        text: MOCK_TEXT,
        videoUrl: videoUrl,
        imageUrl: null,
        title: MOCK_TEXT,
        description: MOCK_TEXT,
        tags: [],
        type: 'short'
    };

    const ytCredentials = {
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        token_expires_at: account.token_expires_at
    };

    try {
        const result = await postToYouTube(content, ytCredentials);
        console.log('\n📊 Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('❌ Error in postToYouTube:', err);
    }
}

testLogic();
