const axios = require('axios');

// Simple test script to verify the health check endpoint
async function testHealthCheck() {
    console.log('🏥 Testing Health Check Endpoint...');

    try {
        // Assuming server is running on port 3000 (default)
        // If not running, this will fail, which is expected if the server isn't started separately
        const response = await axios.get('http://localhost:3000/api/health');

        console.log('✅ Health Check Response Status:', response.status);
        console.log('📋 Health Check Data:', JSON.stringify(response.data, null, 2));

        // Verify structure
        if (response.data.status && response.data.services) {
            console.log('✅ Response structure is correct');

            // Check specific services
            console.log(`   - Database: ${response.data.services.database}`);
            console.log(`   - Cloudinary: ${response.data.services.cloudinary}`);
            console.log(`   - Anthropic: ${response.data.services.anthropic}`);
            console.log(`   - Email: ${response.data.services.email}`);
        } else {
            console.error('❌ Response structure is incorrect');
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('⚠️  Server is not running on port 3000. Please start the server first.');
        } else {
            console.error('❌ Error testing health check:', error.message);
        }
    }
}

testHealthCheck();
