require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUserEmail(userId) {
    try {
        const { data, error } = await supabase.auth.admin.getUserById(userId);

        if (error) {
            console.error('Error fetching user from auth:', error.message);
            return;
        }

        if (data && data.user) {
            console.log(`Email for user ${userId}: ${data.user.email}`);
        } else {
            console.log('User not found in auth');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

const userId = '9de2c70a-053d-48b1-a711-680f0fd272f9';
getUserEmail(userId);
