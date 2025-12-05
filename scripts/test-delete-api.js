const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const USER_ID = '9de2c70a-053d-48b1-a711-680f0fd272f9';
const POST_ID = '287'; // ID of the post we saw earlier

async function testDelete() {
    console.log(`🧪 Testing DELETE ${API_URL}/queue/${POST_ID} for user ${USER_ID}`);

    try {
        const response = await axios.delete(`${API_URL}/queue/${POST_ID}`, {
            headers: {
                'x-debug-user-id': USER_ID
            }
        });

        console.log('✅ Delete Successful!');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('❌ Delete Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testDelete();
