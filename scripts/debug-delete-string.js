require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDeleteStringId() {
    console.log('🔍 Fetching a queued post...');

    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'queued')
        .limit(1);

    if (error || !posts.length) {
        console.log('❌ No posts found or error:', error);
        return;
    }

    const post = posts[0];
    const stringId = String(post.id);

    console.log(`📄 Found post ID: ${post.id} (Type: ${typeof post.id})`);
    console.log(`🧪 Testing delete with String ID: "${stringId}"`);

    const { error: deleteError, count } = await supabase
        .from('posts')
        .delete({ count: 'exact' })
        .eq('id', stringId) // Passing string ID
        .eq('user_id', post.user_id);

    if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
    } else {
        console.log(`✅ Delete successful. Rows deleted: ${count}`);
    }
}

debugDeleteStringId();
