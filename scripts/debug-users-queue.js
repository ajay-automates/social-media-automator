require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsersAndQueue() {
    console.log('🔍 Analyzing Users and Queued Posts...');

    // 1. Get all queued posts
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, user_id, status, text')
        .eq('status', 'queued');

    if (postsError) {
        console.error('❌ Error fetching posts:', postsError);
        return;
    }

    console.log(`📊 Total Queued Posts: ${posts.length}`);

    // 2. Group by user_id
    const userCounts = {};
    posts.forEach(post => {
        userCounts[post.user_id] = (userCounts[post.user_id] || 0) + 1;
    });

    console.log('\n👥 Posts per User ID:');
    for (const [userId, count] of Object.entries(userCounts)) {
        console.log(`   - User ID: ${userId} | Count: ${count}`);

        // Try to fetch user email if possible (might fail if auth schema is protected)
        // Usually 'users' table in public schema or auth.users
        // Let's try public 'users' table first
        const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();

        if (userData) {
            console.log(`     Email: ${userData.email}`);
        } else {
            // Try to get from auth.users using admin API
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
            if (authUser && authUser.user) {
                console.log(`     Email (Auth): ${authUser.user.email}`);
            } else {
                console.log(`     Email: [Unknown/Not found]`);
            }
        }
    }

    // 3. List first 5 posts IDs
    console.log('\n📝 Sample Post IDs (First 5):');
    posts.slice(0, 5).forEach(post => {
        console.log(`   - ID: ${post.id} | User: ${post.user_id} | Text: ${post.text?.substring(0, 30)}...`);
    });
}

debugUsersAndQueue();
