require('dotenv').config();
const { scheduleAIToolsPosts } = require('../services/ai-tools-scheduler');

async function test() {
    console.log('🧪 Testing AI Tools Scheduler...');

    try {
        const result = await scheduleAIToolsPosts();
        if (result) {
            console.log('✅ Test passed: Posts generated and scheduled');
        } else {
            console.log('❌ Test failed: Function returned false');
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }

    process.exit(0);
}

test();
